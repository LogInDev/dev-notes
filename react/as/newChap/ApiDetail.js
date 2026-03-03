import {
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  Fragment,
  useCallback,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spin } from 'signlw';
import dayjs from 'dayjs';

import { useServicePermission } from '@/hooks/useServicePermission';
import { useToast } from '@/utils/ToastProvider';

import {
  cancelDeleteReserve,
  cancelSubscribe,
  fetchApiList,
  fetchHistoryList,
  fetchManagerList,
  fetchServiceDetail,
  fetchSubscriptionPermission,
  increaseViewCount,
  initState,
  requestSubscribe,
  requestSubscriptionPermission,
  reserveDeleteService,

  // ✅ [CHANGED] DRM actions
  fetchDrmConfig,
  verifyDrmEmpNo,
} from '@/store/reduxStore/detail/reducer';

import { updateOpenPopup } from '@/store/reduxStore/myRegist/reducer';
import { BasenameContext } from '@/utils/Context';
import { getRoutePath } from '@/utils/Str';
import { scrollToPosition } from '@/utils/scrollUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';

import PageLayout from '@/components/Organisms/PageLayout';
import Header from '@/components/Templates/Header';
import Divide from '@/components/Atoms/Divide';
import QuickMenu from '@/components/Organisms/QuickMenu';
import Confirm from '@/components/Atoms/Confirm';
import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';
import DeleteReservationModal from '@/components/Templates/DeleteReservationModal';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Input from '@/components/Atoms/Input';

import Detail from './detail';
import ApiList from './apiList';
import Subscription from './subscription';
import Manager from './manager';
import History from './history';
import MyRegistPopup from '../MyRegist/popup';

// ✅ [CHANGED] 신규 컴포넌트
import DrmAllowIpGrid from '@/components/Organisms/DrmAllowIpGrid';

/* 퀵메뉴 아이콘 모음 */
import basicIcon from '@/assets/images/quickmenu/icon_quickmenu_bagic_off.svg';
import basicActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_bagic_on.svg';
import apiIcon from '@/assets/images/quickmenu/icon_quickmenu_api_off.svg';
import apiActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_api_on.svg';
import subscriptionIcon from '@/assets/images/quickmenu/icon_quickmenu_subscription_off.svg';
import subscriptionActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_subscription_on.svg';
import historyIcon from '@/assets/images/quickmenu/icon_quickmenu_history_off.svg';
import historyActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_history_on.svg';
import requestIcon from '@/assets/images/quickmenu/icon_quickmenu_request_off.svg';
import requestActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_request_on.svg';
import authorityIcon from '@/assets/images/quickmenu/icon_quickmenu_authority_off.svg';
import authorityActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_authority_on.svg';
import qosIcon from '@/assets/images/quickmenu/icon_quickmenu_qos_off.svg';
import qosActiveIcon from '@/assets/images/quickmenu/icon_quickmenu_qos_on.svg';

const defaultConfirm = {
  open: false,
  title: '',
  desc: '',
  okText: '',
  cancelText: '',
  onOk: () => {},
  hideCancel: false,
};
const defaultDeleteDate = dayjs().add(30, 'day').endOf('day');

// ✅ 로컬 포맷 검증만 유지 (서버 검증이 최종)
const isValidDrmEmpNoFormat = (value) => /^X99\d+$/i.test(value?.trim());

const ApiDetail = () => {
  const { addToast } = useToast();
  const { svcId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  // 등록자 혹은 담당자 권한 소유 여부
  const { hasPermission, loading: fetchHasPermissionLoading } =
    useServicePermission(svcId);

  const keyState = useSelector((state) => state.get('keySelect')) || {};
  const keyList = keyState?.keyList || [];
  const fetchKeySuccess = keyState?.fetchSuccess || false;
  const selectedKeyId = keyState?.selectedKeyId;
  const selectedKey = useMemo(
    () => keyList.find((key) => key.keyId === selectedKeyId),
    [keyList, selectedKeyId],
  );

  // CP 관리자 여부
  const adminPermissionState =
    useSelector((state) => state.get('permission')) || {};
  const isAdmin = adminPermissionState?.isAdmin === 'Y';
  const fetchIsAdminSuccess =
    adminPermissionState?.fetchIsAdminSuccess || false;

  const detailPageState = useSelector((state) => state.get('detail')) || {};

  // 권한 요청, 구독 요청, 해제, 삭제, 삭제 취소 로딩 및 성공 여부 상태
  const {
    requestSubscriptionPermissionLoading = false,
    requestSubscriptionPermissionSuccess = false,
    requestSubscribeLoading = false,
    requestSubscribeSuccess = false,
    cancelSubscribeLoading = false,
    cancelSubscribeSuccess = false,
    reserveDeleteServiceLoading = false,
    reserveDeleteServiceSuccess = false,
    cancelDeleteReserveLoading = false,
    cancelDeleteReserveSuccess = false,
  } = detailPageState;

  // fetch 로딩 관련 상태
  const fetchPermissionLoading =
    detailPageState?.permission?.fetchPermissionLoading || false;
  const fetchServiceDetailLoading =
    detailPageState?.detail?.fetchServiceDetailLoading || false;
  const fetchApiListLoading =
    detailPageState?.list?.fetchApiListLoading || false;
  const fetchManagerListLoading =
    detailPageState?.manager?.fetchManagerListLoading || false;
  const fetchHistoryLoading =
    detailPageState?.history?.fetchHistoryLoading || false;

  const fetchServiceDetailSuccess =
    detailPageState?.detail?.fetchServiceDetailSuccess || false;

  const requestLoading =
    requestSubscriptionPermissionLoading ||
    requestSubscribeLoading ||
    cancelSubscribeLoading ||
    reserveDeleteServiceLoading ||
    cancelDeleteReserveLoading;

  const requestSuccess =
    requestSubscriptionPermissionSuccess ||
    requestSubscribeSuccess ||
    cancelSubscribeSuccess ||
    cancelDeleteReserveSuccess;

  const fetchLoading =
    fetchPermissionLoading ||
    fetchServiceDetailLoading ||
    fetchApiListLoading ||
    fetchManagerListLoading ||
    fetchHistoryLoading;

  // 기본 정보 관련 상태
  const detailState = detailPageState?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const isDeleted = serviceDetail?.isDeleted;

  // ✅ [CHANGED] DRM 여부 정상화
  const isDrm = useMemo(
    () => serviceDetail?.svcType === 'DRM',
    [serviceDetail?.svcType],
  );

  // API 목록 관련 상태
  const listState = detailPageState?.list || {};
  const apiList = listState?.apiList || [];
  const checkedList = listState?.checkedList || [];
  const isSubscriptionApprovalPending = useMemo(
    () => apiList.some((api) => api?.subStat === 'APR'),
    [apiList],
  );
  const isCancelableSubscription = useMemo(
    () =>
      apiList.some((api) => api?.subStat === 'APR' || api?.subStat === 'NOR'),
    [apiList],
  );
  const isSubscribeAll = useMemo(
    () =>
      apiList.length === apiList.filter((api) => api?.subStat === 'NOR').length,
    [apiList],
  );

  // 구독 정보 관련 상태
  const permissionState = detailPageState?.permission || {};
  const subscriptionPermission =
    permissionState?.subscriptionPermission || 'NON';

  const SubscriptionAvailability = useMemo(
    () => serviceDetail?.authCd === 'NON' || subscriptionPermission === 'NOR',
    [serviceDetail, subscriptionPermission],
  );

  // 팝업 관련 상태
  const myRegistState = useSelector((state) => state.get('myRegist')) || {};
  const popupState = myRegistState?.popup || {};
  const popupSaveSuccess = popupState?.saveSuccess || false;

  // 스크롤 처리를 위한 Refs
  const scrollRef = useRef(null);
  const detailRef = useRef(null);
  const listRef = useRef(null);
  const subscriptionRef = useRef(null);
  const historyRef = useRef(null);

  const refs =
    hasPermission || isAdmin
      ? [listRef, subscriptionRef, historyRef]
      : [listRef, subscriptionRef];

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [confirm, setConfirm] = useState(defaultConfirm);
  const [openDeleteReservationModal, setOpenDeleteReservationModal] =
    useState(false);

  // =========================================================
  // ✅ [CHANGED] DRM local UI state (입력값만 로컬)
  // =========================================================
  const [drmEmpNo, setDrmEmpNo] = useState('');

  // ✅ redux drm state
  const drmState = detailPageState?.drm || {};
  const drmRootKey = drmState?.rootKey;
  const drmEmpNoStatus = drmState?.empNoStatus || 'idle';
  const drmVerifyLoading = drmState?.verifyEmpNoLoading || false;
  const drmFetchConfigLoading = drmState?.fetchDrmConfigLoading || false;

  // ✅ DRM 사번 검증 통과 여부
  const canRequestSubscribeForDrm = useMemo(() => {
    if (!isDrm) return true;
    const empNo = (drmEmpNo || '').trim().toUpperCase();
    return drmEmpNoStatus === 'valid' && isValidDrmEmpNoFormat(empNo);
  }, [isDrm, drmEmpNo, drmEmpNoStatus]);

  // =========================================================
  // lifecycle
  // =========================================================
  useEffect(() => {
    dispatch(increaseViewCount(svcId));
    return () => {
      dispatch(initState());
    };
  }, []);

  useEffect(() => {
    if (
      fetchIsAdminSuccess &&
      fetchServiceDetailSuccess &&
      fetchHasPermissionLoading === false
    )
      if (serviceDetail?.showYn === 'N' && !isAdmin && !hasPermission) {
        addToast(
          intlObj.get(message['store.warning.isShowNService']),
          'warning',
        );
        navigateToList();
      } else {
        setIsAuthorized(true);
      }
  }, [
    serviceDetail,
    fetchIsAdminSuccess,
    fetchServiceDetailSuccess,
    fetchHasPermissionLoading,
    isAdmin,
    hasPermission,
    intlObj,
    message,
  ]);

  // 요청 성공 시 데이터 새로고침
  useEffect(() => {
    if (requestSuccess || popupSaveSuccess) {
      dispatch(initState());
      dispatch(fetchServiceDetail({ svcId }));
      dispatch(fetchApiList({ svcId, keyId: selectedKey?.keyId }));
      dispatch(fetchManagerList({ svcId }));
      if (hasPermission || isAdmin) dispatch(fetchHistoryList({ svcId }));
      dispatch(
        fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }),
      );
    }
  }, [requestSuccess, popupSaveSuccess]);

  // 삭제 성공 시 목록 페이지로 이동
  useEffect(() => {
    if (reserveDeleteServiceSuccess) {
      navigateToList();
    }
  }, [reserveDeleteServiceSuccess]);

  // 구독 권한 정보 조회
  useEffect(() => {
    if (fetchKeySuccess)
      dispatch(
        fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }),
      );
  }, [svcId, selectedKey, fetchKeySuccess]);

  // ✅ [CHANGED] DRM config 로드 (서비스 상세 로드 성공 후)
  useEffect(() => {
    if (isDrm && fetchServiceDetailSuccess) {
      dispatch(fetchDrmConfig({ svcId }));
    }
  }, [isDrm, fetchServiceDetailSuccess, svcId]);

  // 스크롤링 핸들링
  const handleScroll = () => {
    const scrollEl = scrollRef.current.view;
    const scrollTop = scrollEl.scrollTop;
    const clientHeight = scrollEl.clientHeight;
    const scrollHeight = scrollEl.scrollHeight;
    let topIndex = 0;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      topIndex = refs.length;
    } else {
      const tops = refs.map(
        (ref) => ref.current.offsetTop - scrollEl.offsetTop,
      );
      for (const top of tops) {
        if (scrollTop + 100 < top) break;
        topIndex += 1;
      }
    }
    setActiveMenuIndex(topIndex);
  };

  const handleNavigate = (url) => {
    navigate(`${getRoutePath(basename, url)}`);
  };
  const navigateToList = () => handleNavigate('/api/list');
  const navigateToUpdate = () => handleNavigate(`/api/update/${svcId}`);

  const handleOpenPopup = (key) => {
    dispatch(updateOpenPopup({ open: true, key }));
  };

  const handleCloseConfirm = () => {
    setConfirm(defaultConfirm);
  };

  // =========================================================
  // ✅ [CHANGED] DRM verify (saga)
  // =========================================================
  const onVerifyDrmEmpNo = useCallback(() => {
    const empNoRaw = (drmEmpNo || '').trim();
    const empNo = empNoRaw.toUpperCase();

    if (!empNoRaw) {
      addToast('시스템 계정 사번을 입력해 주세요. (예: X99...)', 'warning');
      return;
    }

    if (!isValidDrmEmpNoFormat(empNo)) {
      addToast('사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.', 'error');
      return;
    }

    dispatch(verifyDrmEmpNo({ svcId, empNo }));
  }, [drmEmpNo, svcId, dispatch, addToast]);

  // DRM 상태 메시지
  const drmStatusMsg = useMemo(() => {
    if (!isDrm) return '';
    if (drmEmpNoStatus === 'valid') return '유효한 시스템 계정입니다.';
    if (drmEmpNoStatus === 'duplicated') return '이미 등록된 시스템 계정입니다.';
    if (drmEmpNoStatus === 'invalid') return '유효하지 않은 시스템 계정입니다.';
    if (drmEmpNoStatus === 'checking') return '확인 중...';
    return "사번 입력 후 '유효성 확인'을 눌러주세요";
  }, [isDrm, drmEmpNoStatus]);

  // =========================================================
  // Confirm open 핸들링 (기존 유지 + DRM gate만 정리)
  // =========================================================
  const handleOpenConfirm = (type) => {
    if (type === 'requestSubscriptionPermission') {
      if (!selectedKey) {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.permissionReq']),
          desc: intlObj.get(message['store.noKey']),
          okText: intlObj.get(message['store.ok']),
          onOk: () => handleCloseConfirm(),
          hideCancel: true,
        });
      } else {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.permissionReq']),
          desc: intlObj.get(message['store.confirm.reqSubPermission']),
          okText: intlObj.get(message['store.ok']),
          onOk: () => handleRequestSubscriptionPermission(),
          cancelText: intlObj.get(message['store.cancel']),
        });
      }
    } else if (type === 'requestSubscribe') {
      // ✅ DRM이면 사번 valid 아니면 confirm 대신 안내만
      if (isDrm && !canRequestSubscribeForDrm) {
        addToast("DRM 서비스는 '시스템 계정 사번' 유효성 확인 후 구독 신청 가능합니다.", 'warning');
        return;
      }

      if (checkedList?.length === 0) {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.subReq']),
          desc: intlObj.get(message['store.validation.notSelectSubApi']),
          okText: intlObj.get(message['store.ok']),
          onOk: () => handleCloseConfirm(),
          hideCancel: true,
        });
      } else {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.subReq']),
          desc: intlObj.get(message['store.confirm.reqSub']),
          okText: intlObj.get(message['store.ok']),
          onOk: () => handleRequestSubscribe(),
          cancelText: intlObj.get(message['store.cancel']),
        });
      }
    } else if (type === 'cancelSubscribe') {
      setConfirm({
        open: true,
        title: intlObj.get(message['store.subCcl']),
        desc: intlObj.get(message['store.confirm.cclSub']),
        okText: intlObj.get(message['store.ok']),
        onOk: () => handleCancelSubscribe(),
        cancelText: intlObj.get(message['store.cancel']),
      });
    } else if (type === 'reserveDeleteService') {
      const existSubscriber = serviceDetail?.subCount > 0;
      if (existSubscriber) {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.deleteApi']),
          desc: intlObj
            .get(message['store.warning.canNotDelete'])
            .split('\n')
            .map((value, index) => (
              <Fragment key={index}>
                {value}
                <br />
              </Fragment>
            )),
          okText: intlObj.get(message['store.settingDate']),
          onOk: () => setOpenDeleteReservationModal(true),
          cancelText: intlObj.get(message['store.cancel']),
        });
      } else {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.deleteApi']),
          desc: intlObj.get(message['store.confirm.deleteApi']),
          okText: intlObj.get(message['store.ok']),
          onOk: () => handleReserveDeleteService(dayjs()),
          cancelText: intlObj.get(message['store.cancel']),
        });
      }
    } else if (type === 'cancelDeleteReserve') {
      setConfirm({
        open: true,
        title: intlObj.get(message['store.cancelDeleteApi']),
        desc: intlObj.get(message['store.confirm.cancelDeleteApi']),
        okText: intlObj.get(message['store.ok']),
        onOk: () => handleCancelDeleteReserve(),
        cancelText: intlObj.get(message['store.cancel']),
      });
    }
  };

  // 구독 권한 신청
  const handleRequestSubscriptionPermission = () => {
    dispatch(
      requestSubscriptionPermission({
        svcId,
        key: selectedKey,
        addToast,
        toastSuccess: intlObj.get(message['store.success.reqSubPermission']),
        toastWarning: intlObj.get(
          message['store.warning.alreadyReqSubPermission'],
        ),
        toastError: intlObj.get(message['store.error.reqSubPermission']),
      }),
    );
    handleCloseConfirm();
  };

  // 구독 신청
  const handleRequestSubscribe = () => {
    if (isDrm && !canRequestSubscribeForDrm) {
      addToast("DRM 서비스는 '시스템 계정 사번' 유효성 확인 후 구독 신청 가능합니다.", 'warning');
      return;
    }

    const targetApiList = apiList.filter((api) =>
      checkedList.includes(api?.apiId),
    );

    dispatch(
      requestSubscribe({
        svcId,
        apiList: targetApiList,
        keyId: selectedKey?.keyId,
        addToast,
        toastSuccess: intlObj.get(message['store.success.reqSub']),
        toastWarning: intlObj.get(message['store.warning.alreadySub']),
        toastError: intlObj.get(message['store.error.reqSub']),
      }),
    );
    handleCloseConfirm();
  };

  // 구독 해제
  const handleCancelSubscribe = () => {
    dispatch(
      cancelSubscribe({
        svcId,
        apiList,
        keyId: selectedKey?.keyId,
        addToast,
        toastSuccess: intlObj.get(message['store.success.cclSub']),
        toastWarning: intlObj.get(message['store.warning.alreadyCcl']),
        toastError: intlObj.get(message['store.error.cclSub']),
      }),
    );
    handleCloseConfirm();
  };

  // 서비스 삭제 예약 완료
  const handleFinishDeleteReservation = (deleteDate) => {
    setConfirm({
      open: true,
      title: intlObj.get(message['store.deleteApi']),
      desc: intlObj
        .get(message['store.confirm.alertToSubscriber'])
        .split('\n')
        .map((value, index) => (
          <Fragment key={index}>
            {value}
            <br />
          </Fragment>
        )),
      okText: intlObj.get(message['store.ok']),
      onOk: () => handleReserveDeleteService(deleteDate),
      cancelText: intlObj.get(message['store.cancel']),
    });
    setOpenDeleteReservationModal(false);
  };

  const handleReserveDeleteService = (date) => {
    dispatch(
      reserveDeleteService({
        svcId,
        resDate: date.format('YYYYMMDDHHmmss'),
        subCount: serviceDetail?.subCount || 0,
        addToast,
        toast: intlObj.get(message['store.success.deleteApi']),
      }),
    );
    handleCloseConfirm();
  };

  const handleCancelDeleteReserve = () => {
    dispatch(
      cancelDeleteReserve({
        svcId,
        addToast,
        toast: intlObj.get(message['store.success.cancelDeleteApi']),
      }),
    );
    handleCloseConfirm();
  };

  // 퀵메뉴
  const quickMenuList = [
    {
      key: 0,
      title: intlObj.get(message['store.baseInfo']),
      onClick: () => scrollToPosition(scrollRef, detailRef, 500),
      icon: basicIcon,
      iconActive: basicActiveIcon,
    },
    {
      key: 1,
      title: intlObj.get(message['store.apiList']),
      onClick: () => scrollToPosition(scrollRef, listRef, 500),
      icon: apiIcon,
      iconActive: apiActiveIcon,
    },
    {
      key: 2,
      title: intlObj.get(message['store.subInfo']),
      onClick: () => scrollToPosition(scrollRef, subscriptionRef, 500),
      icon: subscriptionIcon,
      iconActive: subscriptionActiveIcon,
    },
    ...(hasPermission || isAdmin
      ? [
          {
            key: 3,
            title: intlObj.get(message['store.manageHistory']),
            onClick: () => scrollToPosition(scrollRef, historyRef, 500),
            icon: historyIcon,
            iconActive: historyActiveIcon,
          },
          {
            key: 4,
            title: intlObj.get(message['store.subReq']),
            onClick: () => handleOpenPopup('APR'),
            icon: requestIcon,
            iconActive: requestActiveIcon,
          },
          {
            key: 5,
            title: intlObj.get(message['store.permissionReq']),
            onClick: () => handleOpenPopup('RQP'),
            icon: authorityIcon,
            iconActive: authorityActiveIcon,
          },
          {
            key: 6,
            title: intlObj.get(message['store.settingQos']),
            onClick: () => handleOpenPopup('QOS'),
            icon: qosIcon,
            iconActive: qosActiveIcon,
          },
        ]
      : []),
  ];

  // ✅ DRM 버튼 타입 계산: DRM 아니면 항상 primary 흐름 유지
  const actionBtnType = (baseType = 'primary') => {
    if (!isDrm) return baseType;
    return canRequestSubscribeForDrm ? baseType : 'grey';
  };

  // ✅ RootKey copy
  const handleCopyRootKey = async () => {
    try {
      const rootKey = drmRootKey || serviceDetail?.rootKey;
      if (!rootKey) {
        addToast('root key 정보가 없습니다.', 'warning');
        return;
      }
      await navigator.clipboard.writeText(rootKey);
      addToast('Root Key가 복사되었습니다.', 'success');
    } catch {
      addToast('Root Key 복사에 실패했습니다.', 'error');
    }
  };

  return (
    <PageLayout>
      <Header
        path={[
          intlObj.get(message['store']),
          intlObj.get(message['store.apiDetail']),
        ]}
      />
      <PageLayout.Article onScroll={handleScroll} ref={scrollRef}>
        <Spin spinning={!isAuthorized || requestLoading}>
          <Detail ref={detailRef} />
          <Divide $border={false} top={20} bottom={0} />
          <ApiList ref={listRef} />
          <Divide $border={false} top={20} bottom={0} />
          <Subscription ref={subscriptionRef} />
          <Divide $border={false} top={20} bottom={0} />
          <Manager />
          {(hasPermission || isAdmin) && (
            <>
              <Divide $border={false} top={20} bottom={0} />
              <History ref={historyRef} />
            </>
          )}

          {/* =========================================================
              ✅ [CHANGED] DRM 섹션 (요구사항대로 재구성)
             ========================================================= */}
          {isDrm && (
            <>
              <Divide $border={false} top={20} bottom={0} />

              <Spin spinning={!isAuthorized || fetchLoading || drmFetchConfigLoading}>
                {/* Root Key */}
                <ContentHeader $border={true} title="Root Key" spacing={20} />
                <Division flex={true} gap={10} alignItems={'center'}>
                  <div style={{ wordBreak: 'break-all', opacity: 0.9 }}>
                    {drmRootKey || serviceDetail?.rootKey || '-'}
                  </div>
                  <Buttons.Outlined
                    type={'grey'}
                    onClick={handleCopyRootKey}
                    minWidth="80"
                  >
                    복사
                  </Buttons.Outlined>
                </Division>

                <Divide $border={false} top={20} bottom={0} />

                {/* 시스템 계정 사번 */}
                <ContentHeader $border={true} title="시스템 계정 사번" spacing={20} />

                <Division flex={true} gap={20} alignItems={'center'} mb={20}>
                  <Division.SubTitle>
                    DRM 서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                  </Division.SubTitle>
                </Division>

                <Division flex={true} gap={10} alignItems={'center'}>
                  <Input
                    value={drmEmpNo}
                    onChange={(e) => setDrmEmpNo(e.target.value)}
                    placeholder="예: X990001"
                    maxLength={100}
                    maxWidth={350}
                  />
                  <Buttons.Outlined
                    type={'grey'}
                    onClick={onVerifyDrmEmpNo}
                    minWidth="80"
                    disabled={drmVerifyLoading}
                  >
                    {drmVerifyLoading ? '확인 중...' : '유효성 확인'}
                  </Buttons.Outlined>
                </Division>

                <Divide $border={false} top={10} bottom={0} />
                <div style={{ fontSize: 13, opacity: 0.85 }}>{drmStatusMsg}</div>

                <Divide $border={false} top={20} bottom={0} />

                {/* 허용 IP 관리 (요구사항: Input + 추가 1개 + 4단 리스트) */}
                <DrmAllowIpGrid
                  svcId={svcId}
                  // ✅ 실무: 사번 검증이 valid일 때만 IP 관리 가능하게 잠금
                  disabled={!canRequestSubscribeForDrm}
                />

                <Divide top={30} bottom={0} $border={false} />
              </Spin>
            </>
          )}

          {/* =========================================================
              ✅ 하단 액션 버튼들 (DRM일 때만 gate)
             ========================================================= */}
          <Division flex={true} gap={10} justifyContent={'center'}>
            <Buttons.Basic type={'line'} onClick={navigateToList}>
              {intlObj.get(message['store.list'])}
            </Buttons.Basic>

            {isDeleted === 'APR' ? (
              <>
                {isCancelableSubscription && (
                  <Buttons.Basic
                    type={actionBtnType('primary')}
                    onClick={() => handleOpenConfirm('cancelSubscribe')}
                    disabled={isDrm && !canRequestSubscribeForDrm}
                  >
                    {intlObj.get(message['store.subCcl'])}
                  </Buttons.Basic>
                )}
                {hasPermission || isAdmin ? (
                  <Buttons.Basic
                    type={actionBtnType('primary')}
                    onClick={() => handleOpenConfirm('cancelDeleteReserve')}
                    disabled={isDrm && !canRequestSubscribeForDrm}
                  >
                    {intlObj.get(message['store.cancelDelete'])}
                  </Buttons.Basic>
                ) : (
                  <Buttons.Basic type={actionBtnType('primary')} disabled>
                    {intlObj.get(message['store.toBeEnd'])}
                  </Buttons.Basic>
                )}
              </>
            ) : isDeleted === 'NOR' ? (
              <Buttons.Basic type={actionBtnType('primary')} disabled>
                {intlObj.get(message['store.ended'])}
              </Buttons.Basic>
            ) : (
              <>
                {subscriptionPermission !== 'NOTKEY' && (
                  <>
                    {!SubscriptionAvailability ? (
                      subscriptionPermission === 'APR' ? (
                        <Buttons.Basic type={actionBtnType('primary')} disabled>
                          {intlObj.get(message['store.pendingPermissionApr'])}
                        </Buttons.Basic>
                      ) : (
                        <Buttons.Basic
                          type={actionBtnType('primary')}
                          onClick={() => handleOpenConfirm('requestSubscriptionPermission')}
                          disabled={isDrm && !canRequestSubscribeForDrm}
                        >
                          {intlObj.get(message['store.subPermissionReq'])}
                        </Buttons.Basic>
                      )
                    ) : isSubscriptionApprovalPending ? (
                      <Buttons.Basic type={actionBtnType('primary')} disabled>
                        {intlObj.get(message['store.pendingSubApr'])}
                      </Buttons.Basic>
                    ) : isSubscribeAll ? (
                      <Buttons.Basic
                        type={actionBtnType('primary')}
                        onClick={() => handleOpenConfirm('cancelSubscribe')}
                        disabled={isDrm && !canRequestSubscribeForDrm}
                      >
                        {intlObj.get(message['store.subCcl'])}
                      </Buttons.Basic>
                    ) : (
                      <Buttons.Basic
                        type={actionBtnType('primary')}
                        onClick={() => handleOpenConfirm('requestSubscribe')}
                        disabled={isDrm && !canRequestSubscribeForDrm}
                      >
                        {intlObj.get(message['store.subReq'])}
                      </Buttons.Basic>
                    )}
                  </>
                )}

                {(hasPermission || isAdmin) && (
                  <>
                    <Buttons.Basic type={'primary'} onClick={navigateToUpdate}>
                      {intlObj.get(message['store.edit'])}
                    </Buttons.Basic>
                    <Buttons.Basic
                      type={'primary'}
                      onClick={() => handleOpenConfirm('reserveDeleteService')}
                    >
                      {intlObj.get(message['store.delete'])}
                    </Buttons.Basic>
                  </>
                )}
              </>
            )}
          </Division>

          <QuickMenu data={quickMenuList} activeKeys={[activeMenuIndex]} />

          <Confirm
            open={confirm.open}
            title={confirm.title}
            desc={confirm.desc}
            onOk={confirm.onOk}
            onCancel={() => handleCloseConfirm()}
            okText={confirm.okText}
            cancelText={confirm.cancelText}
            hideCancel={confirm.hideCancel}
          />

          <DeleteReservationModal
            open={openDeleteReservationModal}
            tableData={[serviceDetail]}
            deleteDate={defaultDeleteDate}
            onOk={(deleteDate) => handleFinishDeleteReservation(deleteDate)}
            onCancel={() => setOpenDeleteReservationModal(false)}
          />

          <MyRegistPopup svcId={svcId} />
        </Spin>
      </PageLayout.Article>
    </PageLayout>
  );
};

export default ApiDetail;
