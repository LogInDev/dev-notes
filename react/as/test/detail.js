const [pendingDrmAction, setPendingDrmAction] = useState(null);
// 'requestSubscribe' | 'requestSubscriptionPermission' | null

const startDrmVerify = (nextAction) => {
  if (!isDrm) return true;

  if (!loginSysEmpNo.startsWith('X99')) {
    addToast(intlObj.get(message['store.warning.subscriptionPrerequisite']), 'warning');
    return false;
  }

  if (verifyLoading) return false;

  setPendingDrmAction(nextAction);

  dispatch(
    verifyDrmEmpNo({
      keyId: selectedKey?.keyId,
      sysEmpNo: loginSysEmpNo,
    }),
  );

  return false;
};

if (type === 'requestSubscriptionPermission') {
  if (!selectedKey) {
    setConfirm({
      open: true,
      title: intlObj.get(message['store.permissionReq']),
      desc: intlObj.get(message['store.noKey']),
      okText: intlObj.get(message['store.ok']),
      onOk: handleCloseConfirm,
      hideCancel: true,
    });
    return;
  }

  if (isDrm) {
    startDrmVerify('requestSubscriptionPermission');
    return;
  }

  openRequestPermissionConfirm();
}

if (type === 'requestSubscribe') {
  if (checkedList?.length === 0) {
    setConfirm({
      open: true,
      title: intlObj.get(message['store.subReq']),
      desc: intlObj.get(message['store.validation.notSelectSubApi']),
      okText: intlObj.get(message['store.ok']),
      onOk: handleCloseConfirm,
      hideCancel: true,
    });
    return;
  }

  if (isDrm) {
    startDrmVerify('requestSubscribe');
    return;
  }

  openSubscribeConfirm();
}

const openRequestPermissionConfirm = () => {
  setConfirm({
    open: true,
    title: intlObj.get(message['store.permissionReq']),
    desc: intlObj.get(message['store.confirm.reqSubPermission']),
    okText: intlObj.get(message['store.ok']),
    onOk: handleRequestSubscriptionPermission,
    cancelText: intlObj.get(message['store.cancel']),
  });
};

const openSubscribeConfirm = () => {
  setConfirm({
    open: true,
    title: intlObj.get(message['store.subReq']),
    desc: (
      <>
        {intlObj.get(message['store.confirm.reqSub'])}
        <br />
        <br />
        Key : {selectedKey?.keyName ?? '—'}(
        {selectedKey?.authCd === 'PSN' ? '개인 키' : '시스템 키'})
      </>
    ),
    okText: intlObj.get(message['store.ok']),
    onOk: handleRequestSubscribe,
    cancelText: intlObj.get(message['store.cancel']),
  });
};

useEffect(() => {
  if (!pendingDrmAction) return;
  if (verifyLoading) return;
  if (!verifySuccess && !error) return;

  if (result === VERIFY_STATUS.VALID) {
    setDrmVerifiedEmpNo(loginSysEmpNo);
    dispatch(resetDrmEmpNoResult());

    const nextAction = pendingDrmAction;
    setPendingDrmAction(null);

    if (nextAction === 'requestSubscriptionPermission') {
      openRequestPermissionConfirm();
      return;
    }

    if (nextAction === 'requestSubscribe') {
      openSubscribeConfirm();
      return;
    }
  }

  const errorMessage =
    error?.message ||
    verifyMessage ||
    intlObj.get(message['store.error.reqSub']);

  addToast(errorMessage, 'warning');

  setPendingDrmAction(null);
  dispatch(resetDrmEmpNoResult());
}, [
  pendingDrmAction,
  verifyLoading,
  verifySuccess,
  result,
  error,
  verifyMessage,
  loginSysEmpNo,
]);

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
      addToast(serverMessage || toastWarning, 'warning');
    } else {
      addToast(serverMessage || toastError, 'error');
    }

    yield put(requestSubscriptionPermissionFail());
  }
}

