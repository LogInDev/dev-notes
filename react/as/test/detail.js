import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';

export const getApiStoreWarningMessage = (serverMessage, fallbackMessage) => {
  switch (serverMessage) {
    case 'INVALID':
      return intlObj.get(message['store.validation.invalidSysEmpNo']);

    case 'INVALID_KEY_TYPE':
      return intlObj.get(message['store.validation.selectKeyType']);

    case 'INVALID_KEY':
      return intlObj.get(message['store.validation.invalidKey']);

    case 'DUPLICATED_SYS_EMP_NO':
      return intlObj.get(message['store.validation.duplicatedSysEmpNo']);

    case 'DUPLICATED_KEY':
      return intlObj.get(message['store.validation.duplicatedKey']);

    default:
      return fallbackMessage;
  }
};


import { getApiStoreWarningMessage } from '@/utils/apiStoreErrorUtils';

function* requestSubscriptionPermissionSaga(action) {
  const { svcId, key, addToast, toastSuccess, toastWarning, toastError } =
    action?.payload || {};

  try {
    const body = {
      svcId,
      authCd: key?.authCd,
      authId: key?.prjId,
      keyId: key?.keyId,
    };

    const response = yield call(axiosPostRequestSubscriptionPermission, body);

    if (response.status === 200) {
      addToast(toastSuccess, 'success');
      yield put(requestSubscriptionPermissionSuccess());
    }
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      addToast(
        getApiStoreWarningMessage(serverMessage, toastWarning),
        'warning',
      );
      yield put(requestSubscriptionPermissionFail(serverMessage));
      return;
    }

    addToast(toastError, 'error');
    yield put(requestSubscriptionPermissionFail());
  }
}

function* requestSubscribeSaga(action) {
  const {
    svcId,
    apiList = [],
    keyId,
    addToast,
    toastSuccess,
    toastWarning,
    toastError,
    sysEmpNo,
  } = action?.payload || {};

  try {
    const body = apiList.map((api) => ({
      svcId,
      keyId,
      pubId: api.pubId,
      subStatCd: 'APR',
      aprvReason: '구독 신청',
      sysEmpNo,
    }));

    const response = yield call(axiosPutUpdateSubscribe, body);

    if (response.status === 200) {
      addToast(toastSuccess, 'success');
      yield put(requestSubscribeSuccess());
    }
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      addToast(
        getApiStoreWarningMessage(serverMessage, toastWarning),
        'warning',
      );
      yield put(requestSubscribeFail(serverMessage));
      return;
    }

    addToast(toastError, 'error');
    yield put(requestSubscribeFail());
  }
}

import { getApiStoreWarningMessage } from '@/utils/apiStoreErrorUtils';

const requestSubscribe = useCallback(
  async (svcId, keyId, apiList, autoAppr, verifiedSysEmpNo) => {
    try {
      const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;
      const isDrm = svcType === 'DRM';

      const body = apiList.map((api) => ({
        svcId,
        keyId,
        pubId: api.pubId,
        subStatCd: 'APR',
        aprvReason: '구독 신청',
        sysEmpNo: isDrm ? verifiedSysEmpNo || loginSysEmpNo : undefined,
      }));

      const response = await axios.put(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/api/myPage/modifySub`,
        body,
      );

      if (response.status === 200) {
        addToast(
          autoAppr === 'Y'
            ? `${intlObj.get(message['store.success.reqSubAutoAppr'])} ${intlObj.get(message['store.success.editSubReq.noticeDelay'])}`
            : intlObj.get(message['store.success.reqSub']),
          'success',
        );

        getServiceList({
          keyword: searchedTerm,
          sortBy,
          category: selectedCategories.join(','),
          keyId: selectedKey?.keyId,
        });

        if (expandedIds[0] !== undefined) {
          handleFetchApiListByService(expandedIds[0]);
        }
      }
    } catch (error) {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;

      if (status === 400) {
        addToast(
          getApiStoreWarningMessage(
            serverMessage,
            intlObj.get(message['store.warning.alreadySub']),
          ),
          'warning',
        );
        return;
      }

      addToast(intlObj.get(message['store.error.reqSub']), 'error');
    }
  },
  [
    serviceList,
    loginSysEmpNo,
    addToast,
    searchedTerm,
    sortBy,
    selectedCategories,
    selectedKey,
    expandedIds,
    getServiceList,
    handleFetchApiListByService,
  ],
);


const handleClickSubscribe = useCallback(
  (svcId, apiList, autoAppr) => {
    const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;
    const isDrm = svcType === 'DRM';

    if (isDrm && !isLoginSysEmpNo) {
      addToast(
        intlObj.get(message['store.warning.subscriptionPrerequisite']),
        'warning',
      );
      return;
    }

    const checkedApiList = apiList.filter(
      (api) => api.isChecked === true && api.subStat !== 'NOR',
    );

    if (serviceSubscriptionPermission === 'NON') {
      setSubscribeConfirm({
        open: true,
        title: intlObj.get(message['store.subReq']),
        desc: intlObj.get(message['store.validation.noPermission']),
        onConfirm: () => {},
        hideCancel: true,
      });
      return;
    }

    if (serviceSubscriptionPermission === 'APR') {
      setSubscribeConfirm({
        open: true,
        title: intlObj.get(message['store.subReq']),
        desc: intlObj.get(message['store.warning.isPendingReqPermission']),
        onConfirm: () => {},
        hideCancel: true,
      });
      return;
    }

    if (checkedApiList.length === 0) {
      setSubscribeConfirm({
        open: true,
        title: intlObj.get(message['store.subReq']),
        desc: intlObj.get(message['store.validation.notSelectSubApi']),
        onConfirm: () => {},
        hideCancel: true,
      });
      return;
    }

    if (isDrm) {
      if (verifyLoading) return;

      setPendingDrmSubscribe({
        svcId,
        keyId: selectedKey?.keyId,
        checkedApiList,
        autoAppr,
      });
      setPendingDrmSubscribeVerify(true);

      dispatch(
        verifyDrmEmpNo({
          keyId: selectedKey?.keyId,
        }),
      );
      return;
    }

    setSubscribeConfirm({
      open: true,
      title: intlObj.get(message['store.subReq']),
      desc: (
        <>
          {intlObj?.get?.(message?.['store.confirm.reqSub']) ?? ''}
          <br />
          <br />
          Key : {selectedKey?.keyName ?? '—'}(
          {selectedKey?.authCd === 'PSN' ? '개인 키' : '시스템 키'})
        </>
      ),
      onConfirm: () => {
        requestSubscribe(
          svcId,
          selectedKey?.keyId,
          checkedApiList,
          autoAppr,
          undefined,
        );
      },
      hideCancel: false,
    });
  },
  [
    serviceList,
    isLoginSysEmpNo,
    serviceSubscriptionPermission,
    selectedKey,
    verifyLoading,
    dispatch,
    addToast,
    requestSubscribe,
    intlObj,
    message,
  ],
);
