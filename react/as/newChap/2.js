
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
      if(isDrm && !canRequestSubscribeForDrm){
        addToast("DRM 서비스는 '시스템 계정 사번' 유효성 확인 후 구독 신청 가능합니다.", "warning");
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
    if(isDrm && !canRequestSubscribeForDrm) {
      addToast(
        'DRM 서비스는 "시스템 계정 사번" 유효성 확인 후 구독 신청 가능합니다.', 'warning'
      );
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

  const isDrmSubscribeGateBlocked = useMemo(() => {
    return !canRequestSubscribeForDrm;
  }, [isDrm, canRequestSubscribeForDrm]);

  const getSubscribeButtonType = useCallback(() => {
    if(!isDrm) return 'primary';
    return isDrmSubscribeGateBlocked ? 'grey' : 'primary';
  }, [isDrm, isDrmSubscribeGateBlocked]);

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
                  />
                ) : (
                  <div style={{wordBreak: 'break-all', opacity: 0.9}}>
                    {serviceDetail?.rootKey || '-'}
                  </div>
                )}
                <Buttons.Outlined
                  type={'grey'}
                  onClick={handleClickRootKeyEditOrApply}
                  minWidth="80"
                  disabled={updateRootKeyLoading}
                >
                  {isRootKeyEditing ? '적용' : '수정'}
                </Buttons.Outlined>
              </Division>

              <Divide $border={false} top={30} bottom={0} />

              {/* 허용 IP 관리 */}
              <ContentHeader $border={true} title="허용 IP 관리" spacing={20} />
              <Spin spinning={!isAuthorized || fetchLoading}>
                <DrmAllowIp svcId={svcId} disabled={!isAuthorized} />
              </Spin>

              <Divide $border={false} top={30} bottom={0} />

              {/* 시스템 계정 사번 */}
              <Divide $border={false} top={20} bottom={0} />

              <ContentHeader $border={true} title="시스템 계정 사번" spacing={20} />

              <Division flex={true} gap={20} alignItems={'center'} mb={20}>
                <Division.SubTitle>
                  DRM 서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
                </Division.SubTitle>
              </Division>

              <Division flex={true} gap={10} alignItems={'center'}>
                <Input 
                  value={drmEmpNo}
                  onFocus={handleFocusDrmEmpNo}
                  onChange={(e) => {
                    if(!isSysKeySelected) return;
                    setDrmEmpNo(e.target.value);
                    setDrmStatus(DRM_STATUS.idle);
                    drmVerifiedEmpNoRef.current = null;
                  }}
                  placeholder="예: X9900001"
                  maxLength={100}
                  maxWidth={350}
                  // disabled={!isSysKeySelected}
                />
                <Buttons.Outlined
                  type={'grey'}
                  onClick={verifyDrmEmpNo}
                  minWidth="80"
                  disabled={drmStatus === DRM_STATUS.checking}
                >
                  {drmStatus === DRM_STATUS.checking ? '확인 중...' : '유효성 확인'}
                </Buttons.Outlined>
              </Division>

              <Divide $border={false} top={10} bottom={0} />

              <div style={{ fontSize: 13, opacity: 0.85}}>
                {drmStatus === DRM_STATUS.valid && '유효한 시스템 계정입니다.'}
                {drmStatus === DRM_STATUS.duplicated && '이미 등록된 시스템 계정입니다.'}
                {drmStatus === DRM_STATUS.invalid && '유효하지 않은 시스템 계정입니다.'}
                {drmStatus === DRM_STATUS.idle && '사번 입력 후 "유효성 확인"을 눌러주세요.'}
              </div>

              <Divide $border={false} top={10} bottom={0} />
            </>
          )}
          </Spin>
          
          <Divide $border={false} top={20} bottom={0} />
          <Division flex={true} gap={10} justifyContent={'center'}>
            <Buttons.Basic type={'line'} onClick={navigateToList}>
              {intlObj.get(message['store.list'])}
            </Buttons.Basic>
            {isDeleted === 'APR' ? (
              <>
                {isCancelableSubscription && (
                  // 종료 예정인 경우 > 구독 해제 가능한 API 가 남아있는 경우
                  <Buttons.Basic
                    type={getSubscribeButtonType()}
                    onClick={() => handleOpenConfirm('cancelSubscribe')}
                    disabled={isDrmSubscribeGateBlocked}
                  >
                    {intlObj.get(message['store.subCcl'])}
                  </Buttons.Basic>
                )}
                {hasPermission || isAdmin ? (
                  // 종료 예정인 경우 > 등록자, 담당자, CP 관리자인 경우 삭제 취소 가능
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
                {/* API key 가 존재하는 경우에만 버튼들 출력 */}
                {subscriptionPermission !== 'NOTKEY' && (
                  <>
                    {!SubscriptionAvailability ? (
                      subscriptionPermission === 'APR' ? (
                        // 구독 권한이 없는 경우 > 권한 요청 중인 경우
                        <Buttons.Basic type={getSubscribeButtonType()} disabled>
                          {intlObj.get(message['store.pendingPermissionApr'])}
                        </Buttons.Basic>
                      ) : (
                        // 구독 권한이 없는 경우
                        <Buttons.Basic
                          type={getSubscribeButtonType()}
                          onClick={() =>
                            handleOpenConfirm('requestSubscriptionPermission')
                          }
                          disabled={isDrmSubscribeGateBlocked}
                        >
                          {intlObj.get(message['store.subPermissionReq'])}
                        </Buttons.Basic>
                      )
                    ) : isSubscriptionApprovalPending ? (
                      // 구독 권한이 있는 경우 > 승인 대기 중인 API 가 존재하는 경우
                      <Buttons.Basic type={getSubscribeButtonType()} disabled>
                        {intlObj.get(message['store.pendingSubApr'])}
                      </Buttons.Basic>
                    ) : isSubscribeAll ? (
                      // 구독 권한이 있는 경우 > 승인 대기 중인 API 가 없는 경우 > 모든 API 를 구독한 경우
                      <Buttons.Basic
                        type={getSubscribeButtonType()}
                        onClick={() => handleOpenConfirm('cancelSubscribe')}
                        disabled={isDrmSubscribeGateBlocked}
                      >
                        {intlObj.get(message['store.subCcl'])}
                      </Buttons.Basic>
                    ) : (
                      // 구독 권한이 있는 경우 > 승인 대기 중인 API 가 없는 경우
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
