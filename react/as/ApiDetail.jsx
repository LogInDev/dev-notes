import {
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  Fragment,
  useCallback
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spin } from 'signlw';
import dayjs from 'dayjs';
import axios from 'axios';
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
import ContentHeader from '@/components/Organisms/ContentHeader';
import Input from '@/components/Atoms/Input';
import IpList from './detail/ipList';

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

const DRM_STATUS = {
  idle: 'idle',
  checking: 'checking',
  valid: 'valid',
  duplicated: 'duplicated',
  invalid: 'invalid',
};

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

  // const isDrm = useMemo(() => serviceDetail?.svcType === "DRM", [serviceDetail]);
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
      : [listRef, subscriptionRef]; // 스크롤 위치에 따른 메뉴 활성화를 위한 변수, 제일 앞 요소는 처음부터 활성화 시키므로 detailRef 제외한 나머지

  const [isAuthorized, setIsAuthorized] = useState(false); // 비공개 서비스를 볼 수 있는 권한 체크 통과에 대한 값
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [confirm, setConfirm] = useState(defaultConfirm);
  const [openDeleteReservationModal, setOpenDeleteReservationModal] =
    useState(false);
    
  const [drmEmpNo, setDrmEmpNo] = useState("");
  const [drmStatus, setDrmStatus] = useState(DRM_STATUS.idle);
  const drmCacheRef = useRef(new Map());
  const drmVerifiedEmpNoRef = useRef(null);
  
  const [drmAllowIp, setDrmAllowIp] = useState("");

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

  const verifyDrmEmpNo = useCallback(async () => {
    const empNoRaw = (drmEmpNo || '').trim();
    const empNo = empNoRaw.toUpperCase();

    if(!empNoRaw) {
      addToast("시스템 계정 사번을 입력해 주세요. (예: X99...)", "warning");
      return;
    }

    if(!isValidDrmEmpNoFormat(empNo)) {
      addToast(
        "사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.",
        "error"
      );
      setDrmStatus(DRM_STATUS.invalid);
      drmVerifiedEmpNoRef.current = null;
      return;
    }

    const cached = drmCacheRef.current.get(empNo);
    if(cached) {
      setDrmStatus(cached);
      drmVerifiedEmpNoRef.current = cached === DRM_STATUS.valid ? empNo : null;
      return;
    }

    try {
      setDrmStatus(DRM_STATUS.checking);

      const res = await axios.get(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
        {params: {empNo}}
      );

      const statusRaw = res?.data?.response?.status || res?.data?.status;
      const normalized =
        statusRaw === 'VALID'
          ? DRM_STATUS.valid
          : statusRaw === 'DUPLICATED'
            ? DRM_STATUS.duplicated
            : DRM_STATUS.invalid;

      drmCacheRef.current.set(empNo, normalized);
      setDrmStatus(normalized);
      drmVerifiedEmpNoRef.current = normalized === DRM_STATUS.valid ? empNo : null;

      if (normalized === DRM_STATUS.duplicated) {
        addToast('이미 등록된 시스템 계정입니다.', 'warning');
      } else if (normalized === DRM_STATUS.invalid) {
        addToast('유효하지 않은 시스템 계정입니다.', 'error');
      } else {
        addToast('유효한 시스템 계정입니다.', 'success');
      }
    } catch (e) {
      // 네트워크/서버 오류는 invalid로 캐시하지 않음(재시도 가능)
      setDrmStatus(DRM_STATUS.idle);
      drmVerifiedEmpNoRef.current = null;
      addToast('사번 유효성 확인 중 오류가 발생했습니다.', 'error');
    }
  }, [drmEmpNo, addToast]);


  const canRequestSubscribeForDrm = useMemo(() =>{
    if (!isDrm) return true;
    const empNo = (drmEmpNo || '').trim().toUpperCase();
    return drmStatus === DRM_STATUS.valid && drmVerifiedEmpNoRef.current === empNo;
  }, [isDrm, drmEmpNo, drmStatus]);

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
      if(isDrm && !canRequestSubscribeForDrm) {
        // setConfirm({
        //   open: true,
        //   title: intlObj.get(message['store.subReq']),
        //   desc:
        //     "DRM 서비스 구독 전, '시스템 계정 사번' 유효성 확인이 필요합니다.\n사번 입력 후 '유효성 확인'을 진행해주세요.",
        //   okText: intlObj.get(message['store.ok']),
        //   onOk: () => handleCloseConfirm(),
        //   hideCancel: true,
        // });
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

  const handleCopyRootKey = async () => {
    try{
      const rootKey = serviceDetail?.rootKey;
      if(!rootKey){
        console.log('toast - root key정보가 없습니다')
        return;
      }
      await navigator.clipboard.writeText(rootKey);
    } catch{
      console.error('rootkey 복사실패')
    }
  }

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
          <Divide $border={false} top={20} bottom={0} />
          <Spin spinning={!isAuthorized || fetchLoading}>
          <Divide $border={false} top={20} bottom={0} />
          {isDrm && (
            <>
              <div>
                <ContentHeader 
                  $border={true}
                  title="Root Key"
                  spacing={20}
                />
                <Division flex={true} gap={10} alignItems={"center"}>
                  <div style={{ wordBreak: "break-all", opacity: 0.9}}>
                    {serviceDetail?.rootKey ? serviceDetail.rootKey : "qzLD1O9mBxg5OktLXG+PkA=="}
                  </div>
                  <Buttons.Outlined type={'grey'} onClick={verifyDrmEmpNo} minWidth='80'>
                    {/* {intlObj.get(message['store.add'])} */}
                    수정
                  </Buttons.Outlined>
                </Division>
                  {false && (
                    <Division flex={true} gap={10} alignItems={"center"}>
                      <Input
                        value={drmEmpNo}
                        onChange={(e) => {
                          setDrmEmpNo(e.target.value);
                          setDrmStatus(DRM_STATUS.idle);
                          drmVerifiedEmpNoRef.current = null;
                        }}
                        placeholder="예: X990001"
                        maxLength={100}
                      />
                      <Buttons.Outlined type={'grey'} onClick={verifyDrmEmpNo} minWidth='80'>
                      {/* {intlObj.get(message['store.add'])} */}
                      유효성 확인
                    </Buttons.Outlined>
                    </Division>
                  )}
              </div>
                <Divide $border={false} top={20} bottom={0} />
              <div>
                <ContentHeader
                  // title={intlObj.get(message['store.registApiDetailInfo'])}
                  title='허용 IP 관리'
                  $border={true}
                  spacing={20}
                />
                <Division flex={true} gap={10} alignItems={"center"}>
                  <Input
                    value={drmAllowIp}
                    onChange={(e) => {
                      setDrmAllowIp(e.target.value);
                      setDrmStatus(DRM_STATUS.idle);
                      drmVerifiedEmpNoRef.current = null;
                    }}
                    placeholder="허용 IP를 입력하세요. ( 예 : 10.0.0.0/25 )"
                    maxLength={100}
                    maxWidth={350}
                  />
                  <Buttons.Outlined type={'grey'} onClick={verifyDrmEmpNo} minWidth='80'>
                    {/* {intlObj.get(message['store.add'])} */}
                    추가
                  </Buttons.Outlined>
                </Division>
                <Divide top={10} bottom={0} $border={false} />
                <Spin spinning={fetchApiListLoading}>
                  <IpList />
                </Spin>
              </div>
                <Divide top={30} bottom={0} $border={false} />
            </>
          )}

          <Spin spinning={!isAuthorized || fetchLoading}>
            {isDrm && (
              <>
                <Divide $border={false} top={20} bottom={0} />

                <ContentHeader 
                  $border={true}
                  title="시스템 계정 사번"
                  spacing={20}
                />

                <Division flex={true} gap={20} alignItems={'center'} mb={20}>
                  <Division.SubTitle>
                    DRM  서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                  </Division.SubTitle>
                </Division>

                <Division flex={true} gap={10} alignItems={"center"}>
                  <Input
                    value={drmEmpNo}
                    onChange={(e) => {
                      setDrmEmpNo(e.target.value);
                      setDrmStatus(DRM_STATUS.idle);
                      drmVerifiedEmpNoRef.current = null;
                    }}
                    placeholder="예: X990001"
                    maxLength={100}
                    maxWidth={350}
                  />
                  <Buttons.Outlined type={'grey'} onClick={verifyDrmEmpNo} minWidth='80'>
                  {/* {intlObj.get(message['store.add'])} */}
                  유효성 확인
                </Buttons.Outlined>
                </Division>

                <Divide $border={false} top={10} bottom={0} />

                <div style={{fontSize: 13, opacity: 0.85}}>
                    {drmStatus === DRM_STATUS.valid && "유효한 시스템 계정입니다."}
                    {drmStatus === DRM_STATUS.duplicated && "이미 등록된 시스템 계정입니다."}
                    {drmStatus === DRM_STATUS.invalid && "유효하지 않은 시스템 계정입니다."}
                    {drmStatus === DRM_STATUS.idle && "사번 입력 후 '유효성 확인'을 눌러주세요"}
                </div>
                <Divide $border={false} top={10} bottom={0} />
              </>
            )}
          </Spin>

            <Division flex={true} gap={10} justifyContent={'center'}>
              <Buttons.Basic type={'line'} onClick={navigateToList}>
                {intlObj.get(message['store.list'])}
              </Buttons.Basic>
              {isDeleted === 'APR' ? (
                <>
                  {isCancelableSubscription && (
                    // 종료 예정인 경우 > 구독 해제 가능한 API 가 남아있는 경우
                    <Buttons.Basic
                      type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`} 
                      onClick={() => handleOpenConfirm('cancelSubscribe')}
                    >
                      {intlObj.get(message['store.subCcl'])}
                    </Buttons.Basic>
                  )}
                  {hasPermission || isAdmin ? (
                    // 종료 예정인 경우 > 등록자, 담당자, CP 관리자인 경우 삭제 취소 가능
                    <Buttons.Basic
                      type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}
                      onClick={() => handleOpenConfirm('cancelDeleteReserve')}
                    >
                      {intlObj.get(message['store.cancelDelete'])}
                    </Buttons.Basic>
                  ) : (
                    <Buttons.Basic type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}  disabled>
                      {intlObj.get(message['store.toBeEnd'])}
                    </Buttons.Basic>
                  )}
                </>
              ) : isDeleted === 'NOR' ? (
                <Buttons.Basic type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}  disabled>
                  {intlObj.get(message['store.ended'])}
                </Buttons.Basic>
              ) : (
                <>
                  {/* API key 가 존재하는 경우에만 버튼들 출력 */}
                  {subscriptionPermission !== 'NOTKEY' && (
                    <>
                      {!SubscriptionAvailability ? (
                        subscriptionPermission === 'APR' ? (
                          // 구독 권한이 없는 경우 > 권한 요청 중인 경우
                          // <Buttons.Basic type={'primary'} disabled>
                          <Buttons.Basic type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`} disabled>
                            {intlObj.get(message['store.pendingPermissionApr'])}
                          </Buttons.Basic>
                        ) : (
                          // 구독 권한이 없는 경우
                          <Buttons.Basic
                            type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}
                            onClick={() =>
                              handleOpenConfirm('requestSubscriptionPermission')
                            }
                          >
                            {intlObj.get(message['store.subPermissionReq'])}
                          </Buttons.Basic>
                        )
                      ) : isSubscriptionApprovalPending ? (
                        // 구독 권한이 있는 경우 > 승인 대기 중인 API 가 존재하는 경우
                        <Buttons.Basic type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}  disabled>
                          {intlObj.get(message['store.pendingSubApr'])}
                        </Buttons.Basic>
                      ) : isSubscribeAll ? (
                        // 구독 권한이 있는 경우 > 승인 대기 중인 API 가 없는 경우 > 모든 API 를 구독한 경우
                        <Buttons.Basic
                          type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}
                          onClick={() => handleOpenConfirm('cancelSubscribe')}
                        >
                          {intlObj.get(message['store.subCcl'])}
                        </Buttons.Basic>
                      ) : (
                        // 구독 권한이 있는 경우 > 승인 대기 중인 API 가 없는 경우
                        <Buttons.Basic
                          type={`${drmStatus !== DRM_STATUS.valid ? 'grey' : 'primary'}`}
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
                      <Buttons.Basic
                        type={'primary'}
                        onClick={navigateToUpdate}
                      >
                        {intlObj.get(message['store.edit'])}
                      </Buttons.Basic>
                      <Buttons.Basic
                        type={'primary'}
                        onClick={() =>
                          handleOpenConfirm('reserveDeleteService')
                        }
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
