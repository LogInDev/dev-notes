// ApiDetail.jsx (또는 기존 ApiDetail.js 경로에 그대로 적용)
// ✅ 원본 구조 유지 + DRM( RootKey / 허용IP / 시스템사번 ) 섹션만 "컴포넌트화"로 교체한 전체 코드
// ✅ 주석으로 [DRM][CHANGED] 표시

import {
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  Fragment,
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

import Detail from './detail';
import ApiList from './apiList';
import Subscription from './subscription';
import Manager from './manager';
import History from './history';
import MyRegistPopup from '../MyRegist/popup';

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

/* =========================
 * [DRM][CHANGED] 섹션 컴포넌트 import
 * - 기존 ApiDetail 안에서 RootKey/허용IP/사번 state를 들고 있던 부분 제거
 * - 각각 독립 컴포넌트로 분리 (버그/성능 개선)
 * ========================= */
import DrmRootKeySection from './detail/DrmRootKeySection';
import DrmAllowIpSection from './detail/DrmAllowIpSection';
import DrmEmpNoSection from './detail/DrmEmpNoSection';

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

const DRM_STATUS = {
  idle: 'idle',
  checking: 'checking',
  valid: 'valid',
  duplicated: 'duplicated',
  invalid: 'invalid',
};

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

  // fetch 성공 관련 상태 (첫 로드 시점을 구분하기 위한 값)
  const fetchServiceDetailSuccess =
    detailPageState?.detail?.fetchServiceDetailSuccess || false;

  const requestLoading =
    requestSubscriptionPermissionLoading ||
    requestSubscribeLoading ||
    cancelSubscribeLoading ||
    reserveDeleteServiceLoading ||
    cancelDeleteReserveLoading; // 권한 요청, 구독 요청, 해제, 삭제, 삭제 취소 로딩 여부

  const requestSuccess =
    requestSubscriptionPermissionSuccess ||
    requestSubscribeSuccess ||
    cancelSubscribeSuccess ||
    cancelDeleteReserveSuccess; // 권한 요청, 구독 요청, 해제, 삭제 취소 성공 여부

  const fetchLoading =
    fetchPermissionLoading ||
    fetchServiceDetailLoading ||
    fetchApiListLoading ||
    fetchManagerListLoading ||
    fetchHistoryLoading; // fetch 로딩 여부

  // 기본 정보 관련 상태
  const detailState = detailPageState?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const isDeleted = serviceDetail?.isDeleted;

  // ✅ 실제로는 serviceDetail?.svcType === 'DRM' 를 사용
  // const isDrm = useMemo(() => serviceDetail?.svcType === 'DRM', [serviceDetail]);
  const isDrm = true;

  // API 목록 관련 상태
  const listState = detailPageState?.list || {};
  const apiList = listState?.apiList || [];
  const checkedList = listState?.checkedList || [];

  const isSubscriptionApprovalPending = useMemo(
    () => apiList.some((api) => api?.subStat === 'APR'),
    [apiList],
  ); // 구독 승인 대기 상태가 하나라도 존재하는 경우

  const isCancelableSubscription = useMemo(
    () =>
      apiList.some((api) => api?.subStat === 'APR' || api?.subStat === 'NOR'),
    [apiList],
  ); // 구독 취소로 만들 수 있는 API 가 하나라도 존재하는 경우

  const isSubscribeAll = useMemo(
    () =>
      apiList.length === apiList.filter((api) => api?.subStat === 'NOR').length,
    [apiList],
  ); // 모든 API 를 구독한 경우

  // 구독 정보 관련 상태
  const permissionState = detailPageState?.permission || {};
  const subscriptionPermission =
    permissionState?.subscriptionPermission || 'NON';

  // 구독 가능 여부 (전체 이용 가능 API 이거나 구독 권한이 있는 경우)
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

  /* =========================
   * [DRM][CHANGED]
   * - ApiDetail에서 drmEmpNo/drmStatus/drmAllowIp 등 state 제거
   * - 사번 검증 상태는 DrmEmpNoSection 내부에서 관리
   * - 구독 버튼 enable 조건 연결이 필요하면 onVerified에서 끌어올릴 수 있도록 훅만 열어둠
   * ========================= */
  const [drmVerifiedEmpNo, setDrmVerifiedEmpNo] = useState(null);
  const [drmStatusForButton, setDrmStatusForButton] = useState(DRM_STATUS.idle);

  useEffect(() => {
    dispatch(increaseViewCount(svcId));
    return () => {
      dispatch(initState());
    };
  }, []);

  useEffect(() => {
    // 서비스 공개 여부가 비공개 상태인데 아무런 권한이 없으면 목록 페이지로 redirect
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

  // 스크롤링 핸들링
  const handleScroll = () => {
    const scrollEl = scrollRef.current.view;
    const scrollTop = scrollEl.scrollTop;
    const clientHeight = scrollEl.clientHeight;
    const scrollHeight = scrollEl.scrollHeight;
    let topIndex = 0;

    // 스크롤을 끝까지 내린 경우 마지막 요소 활성화
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      topIndex = refs.length;
    } else {
      const tops = refs.map(
        (ref) => ref.current.offsetTop - scrollEl.offsetTop,
      );
      for (const top of tops) {
        // 활성화 시킬 요소 찾기 (100 만큼 여유)
        if (scrollTop + 100 < top) break;
        topIndex += 1;
      }
    }

    setActiveMenuIndex(topIndex);
  };

  // 페이지 이동 핸들링
  const handleNavigate = (url) => {
    navigate(`${getRoutePath(basename, url)}`);
  };

  // 목록 페이지로 이동
  const navigateToList = () => {
    handleNavigate('/api/list');
  };

  // 수정 페이지로 이동
  const navigateToUpdate = () => {
    handleNavigate(`/api/update/${svcId}`);
  };

  // 팝업 오픈 핸들링
  const handleOpenPopup = (key) => {
    dispatch(
      updateOpenPopup({
        open: true,
        key,
      }),
    );
  };

  // 컨펌 창 닫기 핸들링
  const handleCloseConfirm = () => {
    setConfirm(defaultConfirm);
  };

  // DRM 구독 가능 여부 (버튼 disable용)
  const canRequestSubscribeForDrm = useMemo(() => {
    if (!isDrm) return true;
    // VALID 상태가 아니면 false
    return drmStatusForButton === DRM_STATUS.valid && !!drmVerifiedEmpNo;
  }, [isDrm, drmStatusForButton, drmVerifiedEmpNo]);

  // 컨펌 창 오픈 핸들링
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
      // [DRM] 사번 검증이 필요한 경우, 여기서 confirm 대신 안내만 하거나 막기
      if (isDrm && !canRequestSubscribeForDrm) {
        addToast(
          "DRM 서비스는 '시스템 계정 사번' 유효성 확인 후 구독 신청 가능합니다.",
          'warning',
        );
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

  // 구독 권한 신청 시 핸들링
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

  // 구독 신청 시 핸들링
  const handleRequestSubscribe = () => {
    if (isDrm && !canRequestSubscribeForDrm) {
      addToast(
        "DRM 서비스는 '시스템 계정 사번' 유효성 확인 후 구독 신청 가능합니다.",
        'warning',
      );
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
        // [DRM] backend가 empNo를 필요로 한다면 payload에 포함
        drmEmpNo: drmVerifiedEmpNo || undefined,
        addToast,
        toastSuccess: intlObj.get(message['store.success.reqSub']),
        toastWarning: intlObj.get(message['store.warning.alreadySub']),
        toastError: intlObj.get(message['store.error.reqSub']),
      }),
    );
    handleCloseConfirm();
  };

  // 구독 해제 시 핸들링
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

  // 서비스 삭제 예약 완료 시 핸들링
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

  // 서비스 삭제 시 핸들링
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

  // 서비스 삭제 취소 시 핸들링
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

  const quickMenuList = [
    {
      key: 0,
      title: intlObj.get(message['store.baseInfo']),
      onClick: () => {
        scrollToPosition(scrollRef, detailRef, 500);
      },
      icon: basicIcon,
      iconActive: basicActiveIcon,
    },
    {
      key: 1,
      title: intlObj.get(message['store.apiList']),
      onClick: () => {
        scrollToPosition(scrollRef, listRef, 500);
      },
      icon: apiIcon,
      iconActive: apiActiveIcon,
    },
    {
      key: 2,
      title: intlObj.get(message['store.subInfo']),
      onClick: () => {
        scrollToPosition(scrollRef, subscriptionRef, 500);
      },
      icon: subscriptionIcon,
      iconActive: subscriptionActiveIcon,
    },
    ...(hasPermission || isAdmin
      ? [
          {
            key: 3,
            title: intlObj.get(message['store.manageHistory']),
            onClick: () => {
              scrollToPosition(scrollRef, historyRef, 500);
            },
            icon: historyIcon,
            iconActive: historyActiveIcon,
          },
          {
            key: 4,
            title: intlObj.get(message['store.subReq']),
            onClick: () => {
              handleOpenPopup('APR');
            },
            icon: requestIcon,
            iconActive: requestActiveIcon,
          },
          {
            key: 5,
            title: intlObj.get(message['store.permissionReq']),
            onClick: () => {
              handleOpenPopup('RQP');
            },
            icon: authorityIcon,
            iconActive: authorityActiveIcon,
          },
          {
            key: 6,
            title: intlObj.get(message['store.settingQos']),
            onClick: () => {
              handleOpenPopup('QOS');
            },
            icon: qosIcon,
            iconActive: qosActiveIcon,
          },
        ]
      : []),
  ];

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

          {/* ======================================================
              [DRM][CHANGED]
              - 기존 ApiDetail 내부 구현(루트키/허용ip/input state/버그 가능성)을 제거
              - 섹션 컴포넌트 3개로 교체
              - fetchLoading은 섹션 내부에서도 처리하지만, 페이지 전체 fetchLoading도 그대로 유지
             ====================================================== */}
          {isDrm && (
            <>
              <Divide $border={false} top={20} bottom={0} />
              <Spin spinning={!isAuthorized || fetchLoading}>
                <DrmRootKeySection svcId={svcId} />
              </Spin>

              <Divide $border={false} top={20} bottom={0} />
              <Spin spinning={!isAuthorized || fetchLoading}>
                <DrmAllowIpSection svcId={svcId} />
              </Spin>

              <Divide $border={false} top={20} bottom={0} />
              <Spin spinning={!isAuthorized || fetchLoading}>
                <DrmEmpNoSection
                  svcId={svcId}
                  onVerified={(empNo) => {
                    setDrmVerifiedEmpNo(empNo);
                    setDrmStatusForButton(DRM_STATUS.valid);
                  }}
                  // DrmEmpNoSection 내부에서 duplicated/invalid일 때 onVerified를 호출하지 않으므로
                  // 버튼 조건은 drmVerifiedEmpNo 존재 여부로 통제됨
                />
              </Spin>
            </>
          )}

          {/* ===== 하단 버튼 영역(원본 유지, DRM disable 조건만 유지) ===== */}
          <Divide $border={false} top={10} bottom={0} />

          <Division flex={true} gap={10} justifyContent={'center'}>
            <Buttons.Basic type={'line'} onClick={navigateToList}>
              {intlObj.get(message['store.list'])}
            </Buttons.Basic>

            {isDeleted === 'APR' ? (
              <>
                {isCancelableSubscription && (
                  <Buttons.Basic
                    type={
                      isDrm && !canRequestSubscribeForDrm ? 'grey' : 'primary'
                    }
                    onClick={() => handleOpenConfirm('cancelSubscribe')}
                  >
                    {intlObj.get(message['store.subCcl'])}
                  </Buttons.Basic>
                )}

                {hasPermission || isAdmin ? (
                  <Buttons.Basic
                    type={
                      isDrm && !canRequestSubscribeForDrm ? 'grey' : 'primary'
                    }
                    onClick={() => handleOpenConfirm('cancelDeleteReserve')}
                  >
                    {intlObj.get(message['store.cancelDelete'])}
                  </Buttons.Basic>
                ) : (
                  <Buttons.Basic
                    type={
                      isDrm && !canRequestSubscribeForDrm ? 'grey' : 'primary'
                    }
                    disabled
                  >
                    {intlObj.get(message['store.toBeEnd'])}
                  </Buttons.Basic>
                )}
              </>
            ) : isDeleted === 'NOR' ? (
              <Buttons.Basic
                type={isDrm && !canRequestSubscribeForDrm ? 'grey' : 'primary'}
                disabled
              >
                {intlObj.get(message['store.ended'])}
              </Buttons.Basic>
            ) : (
              <>
                {/* API key 가 존재하는 경우에만 버튼들 출력 */}
                {subscriptionPermission !== 'NOTKEY' && (
                  <>
                    {!SubscriptionAvailability ? (
                      subscriptionPermission === 'APR' ? (
                        <Buttons.Basic
                          type={
                            isDrm && !canRequestSubscribeForDrm
                              ? 'grey'
                              : 'primary'
                          }
                          disabled
                        >
                          {intlObj.get(message['store.pendingPermissionApr'])}
                        </Buttons.Basic>
                      ) : (
                        <Buttons.Basic
                          type={
                            isDrm && !canRequestSubscribeForDrm
                              ? 'grey'
                              : 'primary'
                          }
                          onClick={() =>
                            handleOpenConfirm('requestSubscriptionPermission')
                          }
                        >
                          {intlObj.get(message['store.subPermissionReq'])}
                        </Buttons.Basic>
                      )
                    ) : isSubscriptionApprovalPending ? (
                      <Buttons.Basic
                        type={
                          isDrm && !canRequestSubscribeForDrm
                            ? 'grey'
                            : 'primary'
                        }
                        disabled
                      >
                        {intlObj.get(message['store.pendingSubApr'])}
                      </Buttons.Basic>
                    ) : isSubscribeAll ? (
                      <Buttons.Basic
                        type={
                          isDrm && !canRequestSubscribeForDrm
                            ? 'grey'
                            : 'primary'
                        }
                        onClick={() => handleOpenConfirm('cancelSubscribe')}
                      >
                        {intlObj.get(message['store.subCcl'])}
                      </Buttons.Basic>
                    ) : (
                      <Buttons.Basic
                        type={
                          isDrm && !canRequestSubscribeForDrm
                            ? 'grey'
                            : 'primary'
                        }
                        onClick={() => handleOpenConfirm('requestSubscribe')}
                      >
                        {intlObj.get(message['store.subReq'])}
                      </Buttons.Basic>
                    )}
                  </>
                )}

                {/* 등록자, 담당자, CP 관리자인 경우 */}
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
            onCancel={() => {
              handleCloseConfirm();
            }}
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