
  // 구독 버튼 클릭 시 핸들링
  const handleClickSubscribe = useCallback(
    (svcId, apiList, autoAppr) => {
      const checkedApiList = apiList.filter(
        (api) => api.isChecked === true && api.subStat !== 'NOR',
      );
      if (serviceSubscriptionPermission === 'NON') {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(message['store.validation.noPermission']);
          }),
        );
      } else if (serviceSubscriptionPermission === 'APR') {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(
              message['store.warning.isPendingReqPermission'],
            );
          }),
        );
      } else if (checkedApiList.length > 0) {
        const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;
        const isDrm = svcType === 'DRM';
        if (isDrm) {
          if (!isLoginSysEmpNo) {
            addToast(
              intlObj.get(message['store.warning.subscriptionPrerequisite']),
              'warning',
            );
            return;
          }

          if (verifyLoading) {
            return;
          }

          setPendingDrmSubscribeVerify(true);
          dispatch(
            verifyDrmEmpNo({
              keyId: selectedKey?.keyId,
              sysEmpNo: loginSysEmpNo,
            }),
          );
          return;
        }
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = (
              <>
                {intlObj?.get?.(message?.['store.confirm.reqSub']) ?? ''}
                <br />
                <br />
                Key : {selectedKey?.keyName ?? '—'}(
                {selectedKey?.authCd === 'PSN' ? '개인 키' : '시스템 키'})
              </>
            );
            draft.onConfirm = () => {
              requestSubscribe(
                svcId,
                selectedKey?.keyId,
                checkedApiList,
                autoAppr,
              );
            };
            draft.hideCancel = false;
          }),
        );
      } else {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(
              message['store.validation.notSelectSubApi'],
            );
          }),
        );
      }
    },
    [
      serviceSubscriptionPermission,
      subscribeConfirm,
      selectedKey,
      requestSubscribe,
      intlObj,
      message,
    ],
  );
ibeConfirm);
        }}
        okText={intlObj.get(message['store.ok'])}
        cancelText={intlObj.get(message['store.cancel'])}
        hideCancel={subscribeConfirm.hideCancel}
      />
    </>
  );
};

export default Total;
