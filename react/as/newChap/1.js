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
  updateDrmRootKey,
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

import DrmAllowIp from './drmAllowIp';

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
}

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

  const isSysKeySelected = useMemo(
    () => selectedKey?.authCd === 'SYS',
    [selectedKey]
  )

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

  const isDrm = useMemo(() => serviceDetail?.svcType === 'DRM', [serviceDetail]);

  const drmState = detailPageState?.drm || {};
  const updateRootKeyLoading = drmState?.updateRootKeyLoading || false;
  const updateRootKeySuccess = drmState?.updateRootKeySuccess || false;

  const [isEdiingRootKey, setIsEditingRootKey] = useState(false);
  const [rootKeyDraft, setRootKeyDraft] = useState('');

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

  const [drmEmpNo, setDrmEmpNo] = useState('');
  const [drmStatus, setDrmStatus] = useState(DRM_STATUS.idle);
  const drmCacheRef = useRef(new Map());
  const drmVerifiedEmpNoRef = useRef(null);
  const drmEmpNoInputRef = useRef(null);

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

  const handleDrmEmpNoFocus = useCallback(() => {
    if(!isSysKeySelected) {
      addToast('시스템키를 선택하세요.', 'warning');
      setTimeout(() => {
        drmEmpNoInputRef?.current?.blur?.();
      }, 0);
      return;
    }

    setDrmStatus(DRM_STATUS.idle);
    drmVerifiedEmpNoRef.current = null;
    },
    [selectedKey, addToast]
  );

  const verifyDrmEmpNo = useCallback(async () => {
    if(!isSysKeySelected){
      addToast('시스템키를 선택하세요.', 'warning');
      return;
    }

    const empNoRaw = (drmEmpNo || '').trim();
    const empNo = empNoRaw.toUpperCase();

    if(!empNoRaw){
      addToast("시스템 계정 사번을 입력해 주세요. (예: X99...)", "warining");
      return;
    }

    if(!isValidDrmEmpNoFormat(empNo)){
      addToast("사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.", "error");
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
        `${rocess.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
        { params: {empNo, svcId}}
      );

      const statusRaw = res?.data?.response?.status || res?.data?.status;
      const normalized = 
        statusRaw === "VALID" ?
          DRM_STATUS.valid : (
            statusRaw === "DUPLICATED" ?
              DRM_STATUS.duplicated :
              DRM_STATUS.invalid
          );

      drmCacheRef.current.set(empNo, normalized);
      setDrmStatus(normalized);
      drmVerifiedEmpNoRef.current = normalized === DRM_STATUS.valid ? empNo : null;

      if(normalized === DRM_STATUS.duplicated) {
        addToast("이미 등록된 시스템 계정입니다.", "warning");
      }else if(normalized === DRM_STATUS.invalid){
        addToast("유효하지 않은 시스템 계정입니다.", "error");
      }else {
        addToast("유효한 시스템 계정입니다.", "success");
      }
    } catch(e){
      setDrmStatus(DRM_STATUS.idle);
      drmVerifiedEmpNoRef.current = null;
      addToast("사번 유효성 확인 중 오류가 발생했습니다.", "error");
    }
  }, [drmEmpNo, addToast, isSysKeySelected, svcId]);

  const canRequestSubscribeForDrm = useMemo(() => {
    if(!isDrm) return true;
    const empNo = (drmEmpNo || '').trim().toUpperCase();
    return drmStatus === DRM_STATUS.valid && drmVerifiedEmpNoRef.current === empNo;
  }, [isDrm, drmEmpNo, drmStatus]);

  const handleClickRootKeyEditOrApply = useCallback(() => {
    const currentRootKey = serviceDetail?.rootKey || '';

    if(!isRootKeyEditing) {
      setIsRootKeyEditing(true);
      setRootKeyDraft(currentRootKey);
      return;
    }

    const nextRootKey = (rootKeyDraft || '').trim();
    if(!nextRootKey) {
      addToast('Root Key를 입력해 주세요.', 'warning');
      return;
    }

    dispatch(
      updateRootKey({
        svcId,
        rootKey: nextRootKey,
        toastSuccess: 'Root Key가 적용되었습니다.',
        toastError: 'Root Key 적용에 실패했습니다.'
      }),
    );
  }, [
    addToast,
    dispatch,
    isRootKeyEditing,
    rootKeyDraft,
    serviceDetail,
    svcId,
  ]);

  useEffect(() => {
    if(updateRootKeySuccess) {
      setIsRootKeyEditing(false);
      setRootKeyDraft('');
    }
  }, [updateRootKeySuccess]);
