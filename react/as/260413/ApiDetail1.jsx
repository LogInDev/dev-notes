
서비스 타입이 DRM 타입일 때 'X01'로 시작하는 사번이고
	구독 신청된 api가 없으면 '구독 신청' 버튼 클릭 시 시스템 계정 유효성 검사하는 api인 'verifyDrmEmpNo'요청후 'VALID'결과 나오면 구독 신청 api요청
	모두 다 구독 신청됐으면 기존 로직 적용
	하나라도 구독 신청 안된게 있을 경우 기존 로직 적용

이렇게 로직 되게 수정해줘

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
  fetchDrmEmpNoInfo,
  verifyDrmEmpNo,
  resetDrmEmpNoResult
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
import RootKey from './rootKey';
import AllowIpList from './allowIpList';
import SysEmpNo from './sysEmpNo';

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

const VERIFY_STATUS = {
  VALID: 'VALID',
  DUPLICATED_SYS_EMP_NO: 'DUPLICATED_SYS_EMP_NO',
  DUPLICATED_KEY: 'DUPLICATED_KEY',
  INVALID: 'INVALID',
  INVALID_KEY_TYPE: 'INVALID_KEY_TYPE',
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

  // DRM API인 경우
  const drmRootKeyState =
    useSelector((state) => state.get('detail'))?.drmRootKey || {};
  const drmAllowIpState =
    useSelector((state) => state.get('detail'))?.drmAllowIp || {};
  const rootKeySuccess = drmRootKeyState.success;
  const allowIpSuccess = drmAllowIpState.success;

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
  const isDrm = useMemo(() => serviceDetail?.svcType === 'DRM', [serviceDetail]);
  const drmEmpNoState = detailPageState?.drmEmpNo || {};
  const {
    // infoLoading = false,
    info = null,
    verifyLoading = false,
    success = false,
    result = null,
    error = null,
  } = drmEmpNoState;
  const hasMappedEmpNo = !!info?.sysEmpNo;

  const profile = useSelector((state) => state.get('auth').get('profile'));
  const loginSysEmpNo = profile?.EMP_NO || "";
  const isLoginSysEmpNo = loginSysEmpNo.startsWith('X01');  // TODO-S: X99 사번으로 바꿀것

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

  const verifyMessage = useMemo(() => {
    console.log('verifyMessage===================', result)
    const status = result;

    if (status === VERIFY_STATUS.VALID) {
      // return intlObj.get(message['store.validation.validSysEmpNo']);
      return null;
    }

    if (status === VERIFY_STATUS.DUPLICATED_SYS_EMP_NO) {
      return intlObj.get(message['store.validation.duplicatedSysEmpNo']);
    }

    if (status === VERIFY_STATUS.DUPLICATED_KEY) {
      return intlObj.get(message['store.validation.duplicatedKey']);
    }

    if (status === VERIFY_STATUS.INVALID) {
      return intlObj.get(message['store.validation.invalidSysEmpNo']);
    }

    if (status === VERIFY_STATUS.INVALID_KEY_TYPE) {
      return intlObj.get(message['store.validation.invalidKeyType']);
    }

    if (error?.message) {
      return error.message;
    }

    return null;
  }, [result, error]);

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

  const [drmVerifiedEmpNo, setDrmVerifiedEmpNo] = useState(null);
  const [canRequestSubscribeForDrm, setCanRequestSubscribeForDrm] =
    useState(false);

  const [editingAllowIp, setEditingAllowIp] = useState(null);
  const [editingRootKey, setEditingRootKey] = useState(null);

  useEffect(() => {
    dispatch(increaseViewCount(svcId));
    return () => {
      dispatch(initState());
    };
  }, []);

  useEffect(() =>{
    if(isDrm){
      setCanRequestSubscribeForDrm(isLoginSysEmpNo);
    }
  }, [profile, isDrm]);

  useEffect(() =>{
    if(success){
      if(verifyMessage){
        addToast(verifyMessage, 'warning');
        return;
      }

      if(result === VERIFY_STATUS.VALID){
        handleOpenConfirm('requestSubscribe');
        return;
      }
      return;
    }
  }, [success, verifyMessage]);

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

      if(isDrm && selectedKey?.keyId){
        dispatch(fetchDrmEmpNoInfo({svcId, keyId: selectedKey?.keyId}));
      }
    }
  }, [requestSuccess, popupSaveSuccess]);

  useEffect(() => {
    if (isDrm && (rootKeySuccess || allowIpSuccess)) {
      if (hasPermission || isAdmin) {
        dispatch(fetchHistoryList({ svcId }));
      }
    }
  }, [rootKeySuccess, allowIpSuccess, isDrm]);

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

  useEffect(() => {
    // setDrmVerifiedEmpNo(null);
    // setCanRequestSubscribeForDrm(false);

    if (fetchKeySuccess && selectedKey?.keyId && isDrm) {
      dispatch(fetchDrmEmpNoInfo({ svcId, keyId: selectedKey?.keyId }));
    }
  }, [dispatch, fetchKeySuccess, selectedKey?.keyId, svcId, isDrm]);

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
    if (isDrm) {
      if(editingAllowIp){
        addToast(intlObj.get(message['store.validation.editingAllowIp']), 'warning');
        return;
      }
      if ((hasPermission || isAdmin) && editingRootKey) {
        addToast(intlObj.get(message['store.validation.editingRootKey']), 'warning');
        return;
      }
    }
    handleNavigate('/api/list');
  };

  // 수정 페이지로 이동
  const navigateToUpdate = () => {
    if (isDrm) {
      if(editingAllowIp){
        addToast(intlObj.get(message['store.validation.editingAllowIp']), 'warning');
        return;
      }
      if ((hasPermission || isAdmin) && editingRootKey) {
        addToast(intlObj.get(message['store.validation.editingRootKey']), 'warning');
        return;
      }
    }
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

  const handleDrmValidationChange = useCallback(
    ({ enabled, verifiedEmpNo }) => {
      setCanRequestSubscribeForDrm(!!enabled);
      setDrmVerifiedEmpNo(verifiedEmpNo || null);
    },
    [],
  );
