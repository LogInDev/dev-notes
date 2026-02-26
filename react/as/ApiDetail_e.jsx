// ApiDetail.jsx (수정된 전체 코드 - 너가 보낸 파일 기준, 변경점 주석 포함)

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
import axios from 'axios'; // ✅ [DRM][CHANGED] 사번 검증용 (클릭 시에만 호출)
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

  // ✅ [DRM][CHANGED] DRM 여부 / RootKey 노출 가능 여부
  const isDrm = serviceDetail?.svcType === 'DRM';
  const canManage = hasPermission || isAdmin;

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

  // 구독 가능 여부
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

  // ✅ [DRM][CHANGED] DRM 입력 섹션으로 스크롤하기 위한 ref
  const drmInputRef = useRef(null);

  const refs =
    hasPermission || isAdmin
      ? [listRef, subscriptionRef, historyRef]
      : [listRef, subscriptionRef];

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [confirm, setConfirm] = useState(defaultConfirm);
  const [openDeleteReservationModal, setOpenDeleteReservationModal] =
    useState(false);

  // ✅ [DRM][CHANGED] 사번 검증 상태 (로컬 상태 + 캐시로 성능 최적화)
  const [drmEmpNo, setDrmEmpNo] = useState('');
  const [drmStatus, setDrmStatus] = useState('idle'); // idle | checking | valid | invalid | duplicated
  const [drmCheckedValue, setDrmCheckedValue] = useState(''); // 마지막으로 검증한 값
  const drmCacheRef = useRef(new Map()); // key: `${svcId}:${empNo}` -> {status, message}

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

  // ✅ [DRM][CHANGED] DRM 입력값이 바뀌면 기존 검증 상태를 무효화 (불필요 API 재호출 방지/정합성)
  useEffect(() => {
    if (!isDrm) return;
    if (drmEmpNo !== drmCheckedValue) {
      setDrmStatus('idle');
    }
  }, [drmEmpNo, drmCheckedValue, isDrm]);

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

  const navigateToList = () => {
    handleNavigate('/api/list');
  };

  const navigateToUpdate = () => {
    handleNavigate(`/api/update/${svcId}`);
  };

  const handleOpenPopup = (key) => {
    dispatch(updateOpenPopup({ open: true, key }));
  };

  const handleCloseConfirm = () => {
    setConfirm(defaultConfirm);
  };

  // ✅ [DRM][CHANGED] 사번 형식 검증(로컬) - 형식 틀리면 API 호출 자체를 하지 않음(성능+보안)
  const isValidEmpNoFormat = (value) => /^X99\d+$/i.test(value?.trim());

  // ✅ [DRM][CHANGED] 사번 유효성 확인 API 호출 (클릭 시 1회 + 캐시)
  const verifyDrmEmpNo = useCallback(async () => {
    const empNo = drmEmpNo.trim();

    if (!empNo) {
      addToast('시스템 계정 사번을 입력해 주세요. (예: X99...)', 'warning');
      return;
    }

    if (!isValidEmpNoFormat(empNo)) {
      addToast('사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.', 'error');
      return;
    }

    const cacheKey = `${svcId}:${empNo}`;
    const cached = drmCacheRef.current.get(cacheKey);
    if (cached) {
      // 캐시 hit → API 재호출 없이 즉시 반영 (성능)
      setDrmStatus(cached.status);
      setDrmCheckedValue(empNo);
      if (cached.message) addToast(cached.message, cached.status === 'valid' ? 'success' : 'warning');
      return;
    }

    try {
      setDrmStatus('checking');

      // TODO: 실제 사번 검증 API 엔드포인트/파라미터/응답 스펙에 맞게 교체
      // 가정: GET /drm/verifyEmpNo?empNo=...&svcId=...
      const res = await axios.get(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/verifyEmpNo`,
        { params: { empNo, svcId } },
      );

      // 가정 응답: { valid: boolean, duplicated: boolean, message?: string }
      const payload = res?.data?.response ?? res?.data ?? {};
      const valid = Boolean(payload?.valid);
      const duplicated = Boolean(payload?.duplicated);

      let nextStatus = 'invalid';
      let toastMsg = payload?.message || '';

      if (duplicated) {
        nextStatus = 'duplicated';
        toastMsg = toastMsg || '이미 등록된 시스템 계정입니다.';
        addToast(toastMsg, 'warning');
      } else if (valid) {
        nextStatus = 'valid';
        toastMsg = toastMsg || '유효한 시스템 계정입니다. 구독 신청을 진행할 수 있어요.';
        addToast(toastMsg, 'success');
      } else {
        nextStatus = 'invalid';
        toastMsg = toastMsg || '유효하지 않은 시스템 계정입니다.';
        addToast(toastMsg, 'error');
      }

      setDrmStatus(nextStatus);
      setDrmCheckedValue(empNo);

      // 캐시 저장 (같은 empNo 재검증 시 API 호출 방지)
      drmCacheRef.current.set(cacheKey, { status: nextStatus, message: toastMsg });
    } catch (e) {
      setDrmStatus('idle');
      addToast('시스템 계정 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    }
  }, [drmEmpNo, svcId, addToast]);

  // ✅ [DRM][CHANGED] DRM 구독 가능 조건 (검증 완료 & valid)
  const canRequestSubscribeForDrm =
    !isDrm || (drmStatus === 'valid' && drmCheckedValue === drmEmpNo.trim());

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
      // ✅ [DRM][CHANGED] DRM이면 사번 검증이 먼저 완료되어야 Confirm을 띄움 (불필요 흐름/호출 방지)
      if (isDrm && !canRequestSubscribeForDrm) {
        addToast(
          'DRM 서비스는 시스템 계정 사번 확인 후 구독 신청할 수 있어요.',
          'warning',
        );
        // 입력 섹션으로 이동 (UX + 성능: 불필요 confirm 열지 않음)
        scrollToPosition(scrollRef, drmInputRef, 500);
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

  const handleRequestSubscribe = () => {
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
        // ✅ 필요하면 여기 payload에 drmEmpNo를 추가해서 백에 같이 보내는 것도 가능 (스펙에 따라)
        // drmEmpNo: isDrm ? drmEmpNo.trim() : undefined,
      }),
    );
    handleCloseConfirm();
  };

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

  // 페이지 이동 핸들링
  const handleNavigate = (url) => {
    navigate(`${getRoutePath(basename, url)}`);
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

  // ✅ [DRM][CHANGED] Root Key 복사 (성능 영향 거의 없음)
  const handleCopyRootKey = async () => {
    try {
      const rootKey = serviceDetail?.rootKey;
      if (!rootKey) {
        addToast('Root Key 정보가 없습니다.', 'warning');
        return;
      }
      await navigator.clipboard.writeText(rootKey);
      addToast('Root Key가 복사되었습니다.', 'success');
    } catch {
      addToast('복사에 실패했습니다.', 'error');
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

          {/* ✅ [DRM][CHANGED] DRM + 권한자에게 Root Key 섹션 노출 */}
          {isDrm && canManage && (
            <>
              <Divide $border={false} top={20} bottom={0} />
              <Division border={true} borderRadius={16} pt={16} pr={16} pb={16} pl={16}>
                <Division flex={true} justifyContent={'space-between'} alignItems={'center'}>
                  <Division.Title>Root Key</Division.Title>
                  <Buttons.Basic type={'line'} onClick={handleCopyRootKey}>
                    복사
                  </Buttons.Basic>
                </Division>
                <Divide $border={false} top={10} bottom={0} />
                <div style={{ wordBreak: 'break-all', opacity: 0.9 }}>
                  {serviceDetail?.rootKey ? serviceDetail.rootKey : '-'}
                </div>
                {/* 보안 요구가 있으면 여기서 마스킹 처리/가림 처리로 변경 */}
              </Division>
            </>
          )}

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

          <Divide $border={false} top={20} bottom={0} />

          <Spin spinning={!isAuthorized || fetchLoading}>
            {/* ✅ [DRM][CHANGED] DRM 사번 입력/검증 섹션: 구독 버튼 영역 바로 위에 배치 */}
            {isDrm && (
              <>
                <Division
                  ref={drmInputRef}
                  border={true}
                  borderRadius={16}
                  pt={16}
                  pr={16}
                  pb={16}
                  pl={16}
                  mb={16}
                >
                  <Division.Title>시스템 계정 사번</Division.Title>
                  <Divide $border={false} top={8} bottom={0} />
                  <Division.SubTitle>
                    DRM 서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                  </Division.SubTitle>

                  <Divide $border={false} top={12} bottom={0} />

                  <Division flex={true} gap={10} alignItems={'center'}>
                    <input
                      value={drmEmpNo}
                      onChange={(e) => setDrmEmpNo(e.target.value)}
                      placeholder="예: X99123456"
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 10,
                        border: '1px solid #ddd',
                        padding: '0 12px',
                      }}
                    />
                    <Buttons.Basic
                      type={'primary'}
                      onClick={verifyDrmEmpNo}
                      disabled={drmStatus === 'checking'}
                    >
                      {drmStatus === 'checking' ? '확인 중...' : '유효성 확인'}
                    </Buttons.Basic>
                  </Division>

                  <Divide $border={false} top={10} bottom={0} />

                  {/* 상태 표시(가벼운 텍스트) */}
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {drmStatus === 'valid' && '✅ 유효한 시스템 계정입니다.'}
                    {drmStatus === 'duplicated' && '⚠️ 이미 등록된 시스템 계정입니다.'}
                    {drmStatus === 'invalid' && '❌ 유효하지 않은 시스템 계정입니다.'}
                    {drmStatus === 'idle' && '사번 입력 후 “유효성 확인”을 눌러주세요.'}
                  </div>
                </Division>
              </>
            )}

            <Division flex={true} gap={10} justifyContent={'center'}>
              <Buttons.Basic type={'line'} onClick={navigateToList}>
                {intlObj.get(message['store.list'])}
              </Buttons.Basic>

              {isDeleted === 'APR' ? (
                <>
                  {isCancelableSubscription && (
                    <Buttons.Basic
                      type={'primary'}
                      onClick={() => handleOpenConfirm('cancelSubscribe')}
                    >
                      {intlObj.get(message['store.subCcl'])}
                    </Buttons.Basic>
                  )}
                  {hasPermission || isAdmin ? (
                    <Buttons.Basic
                      type={'primary'}
                      onClick={() => handleOpenConfirm('cancelDeleteReserve')}
                    >
                      {intlObj.get(message['store.cancelDelete'])}
                    </Buttons.Basic>
                  ) : (
                    <Buttons.Basic type={'primary'} disabled>
                      {intlObj.get(message['store.toBeEnd'])}
                    </Buttons.Basic>
                  )}
                </>
              ) : isDeleted === 'NOR' ? (
                <Buttons.Basic type={'primary'} disabled>
                  {intlObj.get(message['store.ended'])}
                </Buttons.Basic>
              ) : (
                <>
                  {subscriptionPermission !== 'NOTKEY' && (
                    <>
                      {!SubscriptionAvailability ? (
                        subscriptionPermission === 'APR' ? (
                          <Buttons.Basic type={'primary'} disabled>
                            {intlObj.get(message['store.pendingPermissionApr'])}
                          </Buttons.Basic>
                        ) : (
                          <Buttons.Basic
                            type={'primary'}
                            onClick={() =>
                              handleOpenConfirm('requestSubscriptionPermission')
                            }
                          >
                            {intlObj.get(message['store.subPermissionReq'])}
                          </Buttons.Basic>
                        )
                      ) : isSubscriptionApprovalPending ? (
                        <Buttons.Basic type={'primary'} disabled>
                          {intlObj.get(message['store.pendingSubApr'])}
                        </Buttons.Basic>
                      ) : isSubscribeAll ? (
                        <Buttons.Basic
                          type={'primary'}
                          onClick={() => handleOpenConfirm('cancelSubscribe')}
                        >
                          {intlObj.get(message['store.subCcl'])}
                        </Buttons.Basic>
                      ) : (
                        <Buttons.Basic
                          type={'primary'}
                          onClick={() => handleOpenConfirm('requestSubscribe')}
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
          </Spin>

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
