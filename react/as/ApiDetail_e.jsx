// ApiDetail.jsx (변경된 부분 전체)
// ✅ [DRM][CHANGED] DRM 사번 입력/검증 섹션 추가 + 구독 신청 전 검증 게이트

import {
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  Fragment,
  useCallback, // ✅ [DRM][CHANGED]
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spin } from 'signlw';
import dayjs from 'dayjs';
import axios from 'axios'; // ✅ [DRM][CHANGED]
import ContentHeader from '@/components/Organisms/ContentHeader'; // ✅ [DRM][CHANGED]
import Division from '@/components/Atoms/Division'; // ✅ [DRM][CHANGED]
import Divide from '@/components/Atoms/Divide'; // 기존에 이미 import 되어있음(파일 상단에 있을 수 있음)

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
import QuickMenu from '@/components/Organisms/QuickMenu';
import Confirm from '@/components/Atoms/Confirm';
import Buttons from '@/components/Atoms/Buttons';
import DeleteReservationModal from '@/components/Templates/DeleteReservationModal';
import Detail from './detail';
import ApiList from './apiList';
import Subscription from './subscription';
import Manager from './manager';
import History from './history';
import MyRegistPopup from '../MyRegist/popup';

/* ...아이콘 import들 동일... */

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

// ✅ [DRM][CHANGED] DRM 검증 상태 enum
const DRM_STATUS = {
  idle: 'idle',
  checking: 'checking',
  valid: 'valid',
  duplicated: 'duplicated',
  invalid: 'invalid',
};

// ✅ [DRM][CHANGED] 사번 포맷 체크(프론트 가드)
const isValidDrmEmpNoFormat = (value) => /^X99/i.test((value || '').trim());

const ApiDetail = () => {
  const { addToast } = useToast();

  const { svcId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

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

  const detailState = detailPageState?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const isDeleted = serviceDetail?.isDeleted;

  // ✅ [DRM][CHANGED] DRM 서비스 여부
  const isDrm = useMemo(() => serviceDetail?.svcType === 'DRM', [serviceDetail]);

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

  const permissionState = detailPageState?.permission || {};
  const subscriptionPermission =
    permissionState?.subscriptionPermission || 'NON';

  const SubscriptionAvailability = useMemo(
    () => serviceDetail?.authCd === 'NON' || subscriptionPermission === 'NOR',
    [serviceDetail, subscriptionPermission],
  );

  const myRegistState = useSelector((state) => state.get('myRegist')) || {};
  const popupState = myRegistState?.popup || {};
  const popupSaveSuccess = popupState?.saveSuccess || false;

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

  // ✅ [DRM][CHANGED] DRM 사번 입력/검증 로컬 상태 + 캐시(Map)
  const [drmEmpNo, setDrmEmpNo] = useState('');
  const [drmStatus, setDrmStatus] = useState(DRM_STATUS.idle);
  const drmCacheRef = useRef(new Map()); // key: EMPNO(upper), value: status(valid/duplicated/invalid)
  const drmVerifiedEmpNoRef = useRef(null); // 마지막으로 valid 판정 받은 empNo(upper)

  // ✅ [DRM][CHANGED] 사번 유효성 API 호출(클릭 시 1회 + 캐시)
  const verifyDrmEmpNo = useCallback(async () => {
    const empNoRaw = (drmEmpNo || '').trim();
    const empNo = empNoRaw.toUpperCase();

    if (!empNoRaw) {
      addToast('사번을 입력해주세요.', 'warning');
      return;
    }
    if (!isValidDrmEmpNoFormat(empNo)) {
      addToast("DRM 서비스는 'X99'로 시작하는 시스템 계정 사번만 가능합니다.", 'warning');
      setDrmStatus(DRM_STATUS.invalid);
      drmVerifiedEmpNoRef.current = null;
      return;
    }

    // 캐시 히트면 네트워크 호출 없이 즉시 반영(성능)
    const cached = drmCacheRef.current.get(empNo);
    if (cached) {
      setDrmStatus(cached);
      drmVerifiedEmpNoRef.current = cached === DRM_STATUS.valid ? empNo : null;
      return;
    }

    try {
      setDrmStatus(DRM_STATUS.checking);

      // ✅ TODO: 실제 엔드포인트/응답 스펙에 맞게만 바꾸면 됨 (구조는 그대로)
      // 예시 응답 가정:
      // { response: { status: "VALID" | "DUPLICATED" | "INVALID" } }
      const res = await axios.get(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
        { params: { empNo } },
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

  useEffect(() => {
    if (reserveDeleteServiceSuccess) {
      navigateToList();
    }
  }, [reserveDeleteServiceSuccess]);

  useEffect(() => {
    if (fetchKeySuccess)
      dispatch(
        fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }),
      );
  }, [svcId, selectedKey, fetchKeySuccess]);

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
    dispatch(
      updateOpenPopup({
        open: true,
        key,
      }),
    );
  };

  const handleCloseConfirm = () => {
    setConfirm(defaultConfirm);
  };

  // ✅ [DRM][CHANGED] DRM 구독 신청 가능 조건 (valid 판정 + 현재 입력값과 일치)
  const canRequestSubscribeForDrm = useMemo(() => {
    if (!isDrm) return true;
    const empNo = (drmEmpNo || '').trim().toUpperCase();
    return drmStatus === DRM_STATUS.valid && drmVerifiedEmpNoRef.current === empNo;
  }, [isDrm, drmEmpNo, drmStatus]);

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
      // ✅ [DRM][CHANGED] DRM은 구독 신청 전 사번 유효성 확인이 선행되어야 함
      if (isDrm && !canRequestSubscribeForDrm) {
        setConfirm({
          open: true,
          title: intlObj.get(message['store.subReq']),
          desc:
            "DRM 서비스 구독 전, '시스템 계정 사번' 유효성 확인이 필요합니다.\n사번 입력 후 '유효성 확인'을 진행해주세요.",
          okText: intlObj.get(message['store.ok']),
          onOk: () => handleCloseConfirm(),
          hideCancel: true,
        });
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
    // ✅ [DRM][CHANGED] 실제 요청 직전에도 한 번 더 guard(안전)
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
    /* 기존 그대로 */
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

          {/* ✅ [DRM][CHANGED] DRM 시스템 계정 사번 섹션 (ApiList/Subscription과 동일 구조) */}
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
                    DRM 서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                  </Division.SubTitle>
                </Division>

                <Division flex={true} gap={10} alignItems={'center'}>
                  <input
                    value={drmEmpNo}
                    onChange={(e) => {
                      // 입력 바뀌면 상태를 idle로 되돌림(검증 재요구)
                      setDrmEmpNo(e.target.value);
                      setDrmStatus(DRM_STATUS.idle);
                      drmVerifiedEmpNoRef.current = null;
                    }}
                    placeholder="예: X990001"
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
                    disabled={drmStatus === DRM_STATUS.checking}
                  >
                    {drmStatus === DRM_STATUS.checking ? '확인 중...' : '유효성 확인'}
                  </Buttons.Basic>
                </Division>

                <Divide $border={false} top={10} bottom={0} />

                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {drmStatus === DRM_STATUS.valid && '유효한 시스템 계정입니다.'}
                  {drmStatus === DRM_STATUS.duplicated && '이미 등록된 시스템 계정입니다.'}
                  {drmStatus === DRM_STATUS.invalid && '유효하지 않은 시스템 계정입니다.'}
                  {drmStatus === DRM_STATUS.idle && "사번 입력 후 '유효성 확인'을 눌러주세요"}
                </div>
              </>
            )}
          </Spin>

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

          {/* 기존 하단 버튼/Confirm/모달 영역 그대로 */}
          {/* ... (기존 코드 유지) ... */}

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