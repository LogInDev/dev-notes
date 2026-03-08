import {
  useContext,
  useRef,
  useEffect,
  useMemo,
  Fragment,
  useState,
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

  // [DRM][NEW]
  fetchDrmEmpNoInfo,
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

  // TODO: 실제 배포 시 아래 라인으로 교체
  // const isDrm = useMemo(() => serviceDetail?.svcType === 'DRM', [serviceDetail]);
  const isDrm = true;

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
        addToast(
          intlObj.get(message['store.warning.isShowNService']),
          'warning',
        );
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
    navigate,
    basename,
  ]);

  useEffect(() => {
    if (requestSuccess || popupSaveSuccess) {
      dispatch(initState());
      dispatch(fetchServiceDetail({ svcId }));
      dispatch(fetchApiList({ svcId, keyId: selectedKey?.keyId }));
      dispatch(fetchManagerList({ svcId }));

      if (hasPermission || isAdmin) {
        dispatch(fetchHistoryList({ svcId }));
      }

      dispatch(
        fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }),
      );

      if (isDrm && selectedKey?.keyId) {
        dispatch(fetchDrmEmpNoInfo({ svcId, keyId: selectedKey.keyId }));
      }
    }
  }, [
    dispatch,
    requestSuccess,
    popupSaveSuccess,
    svcId,
    selectedKey?.keyId,
    hasPermission,
    isAdmin,
    isDrm,
  ]);

  useEffect(() => {
    if (reserveDeleteServiceSuccess) {
      navigateToList();
    }
  }, [reserveDeleteServiceSuccess]);

  useEffect(() => {
    if (fetchKeySuccess) {
      dispatch(
        fetchSubscriptionPermission({ svcId, keyId: selectedKey?.keyId }),
      );
    }
  }, [dispatch, svcId, selectedKey?.keyId, fetchKeySuccess]);

  // [DRM][NEW] key 선택 시 key 기준 시스템 사번 상태 조회
  useEffect(() => {
    if (fetchKeySuccess && selectedKey?.keyId && isDrm) {
      dispatch(fetchDrmEmpNoInfo({ svcId, keyId: selectedKey.keyId }));
    }
  }, [dispatch, fetchKeySuccess, selectedKey?.keyId, svcId, isDrm]);

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
                  keyId={selectedKey?.keyId}
                  selectedKey={selectedKey}
                />
              </Spin>
            </>
          )}

          <Divide $border={false} top={10} bottom={0} />

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
