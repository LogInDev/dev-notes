
  const openSubscribeConfirm = useCallback(() => {
    setConfirm({
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
      okText: intlObj.get(message['store.ok']),
      onOk: () => handleRequestSubscribe(),
      cancelText: intlObj.get(message['store.cancel']),
    });
  }, [selectedKey]);

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
        sysEmpNo: isDrm ? drmVerifiedEmpNo || loginSysEmpNo : undefined,
      }),
    );
    handleCloseConfirm();
  };


이렇게 코드 구성되어 있는데

openSubscribeConfirm(); 

이렇게 실행할 때 
handleRequestSubscribe 함수 안에 객체 값들이 다 빈값이야.

이거  openSubscribeConfirm 함수가 handleRequestSubscribe 이것도 봐라봐야해? 그럼 handleRequestSubscribe 선언을 그 전에 해야하지?
