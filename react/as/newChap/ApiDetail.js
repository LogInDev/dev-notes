// pages/Api/Detail/ApiDetail.js
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
  updateDrmRootKey, // ✅ RootKey 수정 액션 (네가 import한 이름 유지)
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

  // ✅ 시스템키 여부: authCd === 'SYS'
  const isSysKeySelected = useMemo(
    () => selectedKey?.authCd?.toUpperCase?.() === 'SYS',
    [selectedKey],
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
    detailPageState?.history?.fetchHistoryListLoading || false;

  // fetch 성공 관련 상태 (첫 로드 시점을 구분하기 위한 값)
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

  const isDrm = useMemo(
    () => serviceDetail?.svcType === 'DRM',
    [serviceDetail],
  );

  const drmState = detailPageState?.drm || {};
  const updateRootKeyLoading = drmState?.updateRootKeyLoading || false;
  const updateRootKeySuccess = drmState?.updateRootKeySuccess || false;

  // ✅ RootKey 편집 상태
  const [isRootKeyEditing, setIsRootKeyEditing] = useState(false);
  const [rootKeyDraft, setRootKeyDraft] = useState('');

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
    () => apiList.length === apiList.filter((api) => api?.subStat === 'NOR').length,
    [apiList],
  );

  // 구독 정보 관련 상태
  const permissionState = detailPageState?.permission || {};
  const subscriptionPermission = permissionState?.subscriptionPermission || 'NON';

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
    hasPermission || isAdmin ? [listRef, subscriptionRef, historyRef] : [listRef, subscriptionRef];

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [confirm, setConfirm] = useState(defaultConfirm);
  const [openDeleteReservationModal, setOpenDeleteReservationModal] =
    useState(false);

  // ✅ DRM 사번 검증 관련 상태
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
  }, [dispatch, svcId]);

  useEffect(() => {
    if (
      fetchIsAdminSuccess &&
      fetchServiceDetailSuccess &&
      fetchHasPermissionLoading === false
    ) {
      if (serviceDetail?.showYn === 'N' && !isAdmin && !hasPermission) {
        addToast(intlObj.get(message['store.warning.isShowNService']), 'warning');
        navigateToList();
      } else {
        setIsAuthorized(true);
      }
    }
  }, [
    serviceDetail,
    fetchIsAdminSuccess,
    fetchServiceDetailSuccess,
    fetchHasPermissionLoading,
    isAdmin,
    hasPermission,
    addToast,
  ]);

  // 요청 성공 시 데이터 새로고침
  useEffect(() => {
    if (requestSuccess || popupSaveSuccess) {
      dispatch(initState());
      dispatch(fetchServiceDetail({ svcId }));
      dispatch(fetchApiList({ svcId, keyId: selectedKey?.keyId }));
      dispatch(fetchManagerList({ svcId }));
      if (hasPermission || isAdmin) dispatch(fetchHistoryList({ svcId }));
      dispatch(fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }));
    }
  }, [
    requestSuccess,
    popupSaveSuccess,
    dispatch,
    svcId,
    selectedKey?.keyId,
    hasPermission,
    isAdmin,
  ]);

  // 삭제 성공 시 목록 페이지로 이동
  useEffect(() => {
    if (reserveDeleteServiceSuccess) {
      navigateToList();
    }
  }, [reserveDeleteServiceSuccess]);

  // 구독 권한 정보 조회
  useEffect(() => {
    if (fetchKeySuccess) {
      dispatch(fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }));
    }
  }, [dispatch, svcId, selectedKey?.keyId, fetchKeySuccess]);

  // RootKey 적용 성공 시 편집 모드 종료
  useEffect(() => {
    if (updateRootKeySuccess) {
      setIsRootKeyEditing(false);
      setRootKeyDraft('');
    }
  }, [updateRootKeySuccess]);

  // 스크롤링 핸들링
  const handleScroll = () => {
    const scrollEl = scrollRef.current?.view;
    if (!scrollEl) return;

    const scrollTop = scrollEl.scrollTop;
    const clientHeight = scrollEl.clientHeight;
    const scrollHeight = scrollEl.scrollHeight;

    let topIndex = 0;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      topIndex = refs.length;
    } else {
      const tops = refs.map((ref) => ref.current?.offsetTop - scrollEl.offsetTop);
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

  /**
   * ✅ 요구사항 반영
   * - 시스템사번 input에 포커스되면:
   *   1) SYS 키 아니면 toast + blur
   *   2) SYS 키면, 무조건 검증 상태 리셋(= 구독버튼 다시 비활성화)
   */
  const handleDrmEmpNoFocus = useCallback(() => {
    if (!isSysKeySelected) {
      addToast('시스템키를 선택하세요.', 'warning');
      setTimeout(() => {
        drmEmpNoInputRef?.current?.blur?.();
      }, 0);
      return;
    }

    // 포커스 되면 무조건 리셋(요구사항)
    setDrmStatus(DRM_STATUS.idle);
    drmVerifiedEmpNoRef.current = null;
  }, [isSysKeySelected, addToast]);

  const verifyDrmEmpNo = useCallback(async () => {
    if (!isSysKeySelected) {
      addToast('시스템키를 선택하세요.', 'warning');
      return;
    }

    const empNoRaw = (drmEmpNo || '').trim();
    const empNo = empNoRaw.toUpperCase();

    if (!empNoRaw) {
      addToast('시스템 계정 사번을 입력해 주세요. (예: X99...)', 'warning');
      return;
    }

    if (!isValidDrmEmpNoFormat(empNo)) {
      addToast(
        '사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.',
        'error',
      );
      setDrmStatus(DRM_STATUS.invalid);
      drmVerifiedEmpNoRef.current = null;
      return;
    }

    const cached = drmCacheRef.current.get(empNo);
    if (cached) {
      setDrmStatus(cached);
      drmVerifiedEmpNoRef.current = cached === DRM_STATUS.valid ? empNo : null;
      return;
    }

    try {
      setDrmStatus(DRM_STATUS.checking);

      // ✅ 오타 수정: process.env
      const res = await axios.get(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
        { params: { empNo, svcId } },
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
      setDrmStatus(DRM_STATUS.idle);
      drmVerifiedEmpNoRef.current = null;
      addToast('사번 유효성 확인 중 오류가 발생했습니다.', 'error');
    }
  }, [drmEmpNo, addToast, isSysKeySelected, svcId]);

  /**
   * ✅ DRM 구독 게이트(요구사항 반영)
   * - SYS 키여야 함
   * - 사번 검증 valid여야 함
   * - 검증 완료 값과 현재 input 값이 같아야 함
   */
  const canRequestSubscribeForDrm = useMemo(() => {
    if (!isDrm) return true;
    const empNo = (drmEmpNo || '').trim().toUpperCase();

    return (
      isSysKeySelected &&
      drmStatus === DRM_STATUS.valid &&
      drmVerifiedEmpNoRef.current === empNo
    );
  }, [isDrm, drmEmpNo, drmStatus, isSysKeySelected]);

  /**
   * ✅ RootKey 수정/적용 버튼
   * - '수정' 클릭 → input 표시
   * - '적용' 클릭 → API 요청(사가) → 성공 시 input 닫힘
   */
  const handleClickRootKeyEditOrApply = useCallback(() => {
    const currentRootKey = serviceDetail?.rootKey || '';

    if (!isRootKeyEditing) {
      setIsRootKeyEditing(true);
      setRootKeyDraft(currentRootKey);
      return;
    }

    const nextRootKey = (rootKeyDraft || '').trim();
    if (!nextRootKey) {
      addToast('Root Key를 입력해 주세요.', 'warning');
      return;
    }

    dispatch(
      updateDrmRootKey({
        svcId,
        rootKey: nextRootKey,
        addToast,
        toastSuccess: 'Root Key가 적용되었습니다.',
        toastError: 'Root Key 적용에 실패했습니다.',
      }),
    );
  }, [
    addToast,
    dispatch,
    isRootKeyEditing,
    rootKeyDraft,
    serviceDetail?.rootKey,
    svcId,
  ]);

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

  const handleRequestSubscriptionPermission = () => {
    dispatch(
      requestSubscriptionPermission({
        svcId,
        key: selectedKey,
        addToast,
        toastSuccess: intlObj.get(message['store.success.reqSubPermission']),
        toastWarning: intlObj.get(message['store.warning.alreadyReqSubPermission']),
        toastError: intlObj.get(message['store.error.reqSubPermission']),
      }),
    );
    handleCloseConfirm();
  };

  const handleRequestSubscribe = () => {
    if (isDrm && !canRequestSubscribeForDrm) {
      addToast(
        'DRM 서비스는 "시스템 계정 사번" 유효성 확인 후 구독 신청 가능합니다.',
        'warning',
      );
      return;
    }

    const targetApiList = apiList.filter((api) => checkedList.includes(api?.apiId));
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

  // ✅ DRM이면 구독버튼/요청버튼들 비활성화
  const isDrmSubscribeGateBlocked = useMemo(() => {
    if (!isDrm) return false;
    return !canRequestSubscribeForDrm;
  }, [isDrm, canRequestSubscribeForDrm]);

  const getSubscribeButtonType = useCallback(() => {
    if (!isDrm) return 'primary';
    return isDrmSubscribeGateBlocked ? 'grey' : 'primary';
  }, [isDrm, isDrmSubscribeGateBlocked]);

  return (
    <PageLayout>
      <Header
        path={[intlObj.get(message['store']), intlObj.get(message['store.apiDetail'])]}
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

          <Divide $border={false} top={30} bottom={0} />

          <Spin spinning={!isAuthorized || fetchLoading}>
            {isDrm && (
              <>
                {/* Root Key */}
                <ContentHeader $border={true} title="Root Key" spacing={20} />
                <Division flex={true} gap={10} alignItems={'center'}>
                  {isRootKeyEditing ? (
                    <Input
                      value={rootKeyDraft}
                      onChange={(e) => setRootKeyDraft(e.target.value)}
                      placeholder="Root Key를 입력하세요."
                      maxLength={200}
                      maxWidth={350}
                      disabled={updateRootKeyLoading}
                    />
                  ) : (
                    <div style={{ wordBreak: 'break-all', opacity: 0.9 }}>
                      {serviceDetail?.rootKey || '-'}
                    </div>
                  )}

                  <Buttons.Outlined
                    type={'grey'}
                    onClick={handleClickRootKeyEditOrApply}
                    minWidth="80"
                    disabled={updateRootKeyLoading}
                  >
                    {updateRootKeyLoading ? '적용 중...' : isRootKeyEditing ? '적용' : '수정'}
                  </Buttons.Outlined>
                </Division>

                <Divide $border={false} top={30} bottom={0} />

                {/* 허용 IP 관리 */}
                <ContentHeader $border={true} title="허용 IP 관리" spacing={20} />
                <DrmAllowIp svcId={svcId} disabled={!isAuthorized} />

                <Divide $border={false} top={30} bottom={0} />

                {/* 시스템 계정 사번 */}
                <ContentHeader $border={true} title="시스템 계정 사번" spacing={20} />

                <Division flex={true} gap={20} alignItems={'center'} mb={20}>
                  <Division.SubTitle>
                    DRM 서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                  </Division.SubTitle>
                </Division>

                <Division flex={true} gap={10} alignItems={'center'}>
                  <Input
                    ref={drmEmpNoInputRef}
                    value={drmEmpNo}
                    onFocus={handleDrmEmpNoFocus}
                    onChange={(e) => {
                      // SYS 키 아니면 입력 자체 막기(요구사항 3)
                      if (!isSysKeySelected) return;

                      setDrmEmpNo(e.target.value);
                      setDrmStatus(DRM_STATUS.idle);
                      drmVerifiedEmpNoRef.current = null;
                    }}
                    placeholder="예: X9900001"
                    maxLength={100}
                    maxWidth={350}
                  />
                  <Buttons.Outlined
                    type={'grey'}
                    onClick={verifyDrmEmpNo}
                    minWidth="80"
                    disabled={drmStatus === DRM_STATUS.checking || !isSysKeySelected}
                  >
                    {drmStatus === DRM_STATUS.checking ? '확인 중...' : '유효성 확인'}
                  </Buttons.Outlined>
                </Division>

                <Divide $border={false} top={10} bottom={0} />

                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {drmStatus === DRM_STATUS.valid && '유효한 시스템 계정입니다.'}
                  {drmStatus === DRM_STATUS.duplicated && '이미 등록된 시스템 계정입니다.'}
                  {drmStatus === DRM_STATUS.invalid && '유효하지 않은 시스템 계정입니다.'}
                  {drmStatus === DRM_STATUS.checking && '유효성 확인 중입니다...'}
                  {drmStatus === DRM_STATUS.idle && '사번 입력 후 "유효성 확인"을 눌러주세요.'}
                </div>

                <Divide $border={false} top={10} bottom={0} />
              </>
            )}
          </Spin>

          <Divide $border={false} top={20} bottom={0} />

          {/* 하단 버튼 영역 */}
          <Division flex={true} gap={10} justifyContent={'center'}>
            <Buttons.Basic type={'line'} onClick={navigateToList}>
              {intlObj.get(message['store.list'])}
            </Buttons.Basic>

            {isDeleted === 'APR' ? (
              <>
                {isCancelableSubscription && (
                  <Buttons.Basic
                    type={getSubscribeButtonType()}
                    onClick={() => handleOpenConfirm('cancelSubscribe')}
                    disabled={isDrmSubscribeGateBlocked}
                  >
                    {intlObj.get(message['store.subCcl'])}
                  </Buttons.Basic>
                )}
                {hasPermission || isAdmin ? (
                  <Buttons.Basic
                    type={getSubscribeButtonType()}
                    onClick={() => handleOpenConfirm('cancelDeleteReserve')}
                    disabled={isDrmSubscribeGateBlocked}
                  >
                    {intlObj.get(message['store.cancelDelete'])}
                  </Buttons.Basic>
                ) : (
                  <Buttons.Basic type={getSubscribeButtonType()} disabled>
                    {intlObj.get(message['store.toBeEnd'])}
                  </Buttons.Basic>
                )}
              </>
            ) : isDeleted === 'NOR' ? (
              <Buttons.Basic type={getSubscribeButtonType()} disabled>
                {intlObj.get(message['store.ended'])}
              </Buttons.Basic>
            ) : (
              <>
                {subscriptionPermission !== 'NOTKEY' && (
                  <>
                    {!SubscriptionAvailability ? (
                      subscriptionPermission === 'APR' ? (
                        <Buttons.Basic type={getSubscribeButtonType()} disabled>
                          {intlObj.get(message['store.pendingPermissionApr'])}
                        </Buttons.Basic>
                      ) : (
                        <Buttons.Basic
                          type={getSubscribeButtonType()}
                          onClick={() => handleOpenConfirm('requestSubscriptionPermission')}
                          disabled={isDrmSubscribeGateBlocked}
                        >
                          {intlObj.get(message['store.subPermissionReq'])}
                        </Buttons.Basic>
                      )
                    ) : isSubscriptionApprovalPending ? (
                      <Buttons.Basic type={getSubscribeButtonType()} disabled>
                        {intlObj.get(message['store.pendingSubApr'])}
                      </Buttons.Basic>
                    ) : isSubscribeAll ? (
                      <Buttons.Basic
                        type={getSubscribeButtonType()}
                        onClick={() => handleOpenConfirm('cancelSubscribe')}
                        disabled={isDrmSubscribeGateBlocked}
                      >
                        {intlObj.get(message['store.subCcl'])}
                      </Buttons.Basic>
                    ) : (
                      <Buttons.Basic
                        type={getSubscribeButtonType()}
                        onClick={() => handleOpenConfirm('requestSubscribe')}
                        disabled={isDrmSubscribeGateBlocked}
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