
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

  // card type 데이터
  const cardTableData = useMemo(
    () =>
      produce(serviceList, (draft) => {
        draft.map((value, index) => {
          const svcId = value?.svcId;
          const autoAppr = value?.autoAppr;
          const apiListOfService = apiListByService?.[svcId] || [];
          const hasPendingApproval = value?.subStatCd === 'APR';
          const hasSubscribed = value?.subStatCd === 'NOR';
          const hasKey = selectedKey !== undefined;
          const isExpanded = !expandedIds.includes(svcId);
          value.key = svcId || index.toString();
          value.category = categoryLanguage?.[value?.catId] || '-';
          value.title = (
            <>
              {value?.svcType && value?.svcType !== 'API'
                ? `[${value?.svcType}] `
                : ''}
              {highlightText(value?.title, searchTerm)}
            </>
          );
          value.subTitle =
            value?.svcType && value?.svcType === 'LLM' && value?.svcModel ? (
              <ModelName size={'small'}>
                {highlightText(value?.svcModel || 'gemma-8ab-test', searchTerm)}
              </ModelName>
            ) : undefined;
          value.description = highlightText(value?.description, searchTerm);
          value.onClick = handleNavigateToDetail;
          value.extra = hasPendingApproval ? (
            <Buttons.ColorFilled
              type={'orange'}
              size={'large'}
              onClick={(e) => {
                e.stopPropagation();
                handleExpandCollapseTable(isExpanded, svcId);
              }}
            >
              {intlObj.get(message['store.pendingApr'])}
            </Buttons.ColorFilled>
          ) : value?.subStatCd === 'NOR' ? (
            <Buttons.ColorFilled
              type={'green'}
              size={'large'}
              onClick={(e) => {
                e.stopPropagation();
                handleExpandCollapseTable(isExpanded, svcId);
              }}
            >
              {intlObj.get(message['store.subscribing'])}
            </Buttons.ColorFilled>
          ) : (
            <Buttons.ColorFilled
              type={'primary'}
              size={'large'}
              onClick={(e) => {
                e.stopPropagation();
                handleExpandCollapseTable(isExpanded, svcId);
              }}
            >
              {intlObj.get(message['store.subReq'])}
            </Buttons.ColorFilled>
          );
          value.expandedArea = (
            <ExpandedTable
              loading={fetchApiListByServiceLoading}
              data={apiListOfService}
              onClickSubscribe={() =>
                handleClickSubscribe(svcId, apiListOfService, autoAppr)
              }
              hasPendingApproval={hasPendingApproval}
              hasKey={hasKey}
              hasSubscribed={hasSubscribed}
              onCheckApi={(name, checked) =>
                handleCheckApi(svcId, name, checked)
              }
            />
          );
        });
      }),
    [
      categoryLanguage,
      serviceList,
      apiListByService,
      fetchApiListByServiceLoading,
      searchTerm,
      expandedIds,
      selectedKey,
      handleClickSubscribe,
      intlObj,
      message,
    ],
  );

  // list type column
  const listTableColumns = useMemo(
    () => [
      {
        title: intlObj.get(message['store.apiName']),
        dataIndex: 'title',
        key: 'title',
        width: '17%',
        resize: true,
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) => compareString(a?.title, b?.title, order),
        render: (text, record) => (
          <>
            {record?.svcType && record?.svcType !== 'API'
              ? `[${record?.svcType}] `
              : ''}
            {highlightText(text, searchTerm)}
            {record?.svcType &&
              record?.svcType === 'LLM' &&
              record?.svcModel && (
                <>
                  <br />
                  <ModelName size={'small'}>
                    {highlightText(record?.svcModel, searchTerm)}
                  </ModelName>
                </>
              )}
          </>
        ),
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.apiDesc']),
        dataIndex: 'description',
        key: 'description',
        width: 'auto',
        resize: true,
        ellipsis: true,
        render: (text) => (
          <Ellipsis line={2}>{highlightText(text, searchTerm)}</Ellipsis>
        ),
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.category']),
        dataIndex: 'category',
        key: 'category',
        width: '13%',
        resize: true,
        ellipsis: true,
        align: 'center',
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            categoryLanguage?.[a?.catId],
            categoryLanguage?.[b?.catId],
            order,
          ),
        render: (text, record) => categoryLanguage?.[record?.catId] || '-',
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.viewCount']),
        dataIndex: 'vwCnt',
        key: 'vwCnt',
        width: '7%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) => compareNumber(a?.vwCnt, b?.vwCnt, order),
        render: (text) => text,
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.subCount']),
        dataIndex: 'subCount',
        key: 'subCount',
        width: '7%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) => compareNumber(a?.subCount, b?.subCount, order),
        render: (text) => text,
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.updDttm']),
        dataIndex: 'updDttm',
        key: 'updDttm',
        width: '12%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) => compareString(a?.updDttm, b?.updDttm, order),
        render: (text) => {
          if (text) {
            return dayjs(text).format('YYYY.MM.DD');
          } else {
            return '-';
          }
        },
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.subscribe']),
        dataIndex: 'subscription',
        key: 'subscription',
        width: '12%',
        resize: true,
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) => {
          return compareWithPriority(
            a?.subStatCd,
            b?.subStatCd,
            order,
            subscriptionStatuspriority,
          );
        },
        filters: statusFilters,
        align: 'center',
        onFilter: (value, record) => onFilter(value, record?.subStatCd),
        render: (text, record) => {
          const svcId = record?.svcId;
          const isExpanded = !expandedIds.includes(svcId);
          let button;
          if (record.subStatCd === 'APR') {
            button = (
              <Buttons.ColorFilled
                type={'orange'}
                size={'small'}
                onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
              >
                {intlObj.get(message['store.pendingApr'])}
              </Buttons.ColorFilled>
            );
          } else if (record.subStatCd === 'NOR') {
            button = (
              <Buttons.ColorFilled
                type={'green'}
                size={'small'}
                onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
              >
                {intlObj.get(message['store.subscribing'])}
              </Buttons.ColorFilled>
            );
          } else if (record.subStatCd === 'N') {
            button = (
              <Buttons.ColorFilled
                type={'primary'}
                size={'small'}
                onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
              >
                {intlObj.get(message['store.subReq'])}
              </Buttons.ColorFilled>
            );
          } else {
            button = (
              <Buttons.ColorFilled
                type={'primary'}
                size={'small'}
                onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
              >
                {intlObj.get(message['store.subReq'])}
              </Buttons.ColorFilled>
            );
          }
          return button;
        },
        onCell: () => ({
          onClick: (e) => e.stopPropagation(),
        }),
      },
    ],
    [
      searchTerm,
      categoryLanguage,
      expandedIds,
      statusFilters,
      intlObj,
      message,
    ],
  );

  // list type 데이터
  const listTableData = useMemo(
    () =>
      produce(serviceList, (draft) => {
        draft.map((value, index) => {
          const svcId = value?.svcId;
          const autoAppr = value?.autoAppr;
          const hasPendingApproval = value.subStatCd === 'APR';
          const hasSubscribed = value.subStatCd === 'NOR';
          const hasKey = selectedKey !== undefined;
          const apiListOfServie = apiListByService?.[svcId] || [];
          value.expandedArea = (
            <ExpandedTable
              loading={fetchApiListByServiceLoading}
              key={svcId}
              data={apiListOfServie}
              hasPendingApproval={hasPendingApproval}
              hasKey={hasKey}
              hasSubscribed={hasSubscribed}
              onClickSubscribe={() =>
                handleClickSubscribe(svcId, apiListOfServie, autoAppr)
              }
              onCheckApi={(name, checked) =>
                handleCheckApi(svcId, name, checked)
              }
              type={'borderless'}
            />
          );
        });
      }),
    [
      serviceList,
      apiListByService,
      fetchApiListByServiceLoading,
      selectedKey,
      handleClickSubscribe,
    ],
  );

  return (
    <>
      <ContentHeader
        spacing={10}
        paddingBottom={0}
        title={
          <Dropdown
            title={sortOptions.find((item) => item.key === sortBy)?.label || ''}
            subTitle={`(${serviceList.length})`}
            items={sortOptions}
          />
        }
        $border={false}
        extraContent={
          <Division flex={true} gap={10}>
            {keyList.length > 0 ? (
              <Selector onClick={() => setOpenKeyPopup(true)} icon={'key'}>
                {selectedKey?.keyName}
              </Selector>
            ) : (
              <ApplyKey onClick={handleNavigateToMyKeys} />
            )}
            <Selector
              onClick={() => setOpenCategoryPopup(true)}
              onClear={() => setSelectedCategories([])}
              placeholder={intlObj.get(message['store.selectCategory'])}
              width={184}
            >
              {selectedCategories.length === 0 ? [] : [selectedCategoryName]}
            </Selector>
            <ViewToggler
              viewType={viewType}
              onClick={(type) => handleToggleViewType(type)}
            />
          </Division>
        }
      />
      {viewType === 'card' ? (
        <CardTable
          loading={fetchSelectedKeyIdLoading || fetchServiceListLoading}
          data={cardTableData}
          expandedCardKey={expandedIds[0]}
          gap={20}
          page={page}
          pageSize={pageSize}
          onPageChange={(page) => setPage(page)}
          paginationExtraContent={
            <Select
              options={pageSizeOptions.card}
              value={pageSize}
              onSelect={(value) => setPageSize(value)}
            />
          }
          emptyText={
            <NoData
              title={'No Data'}
              desc={intlObj.get(message['store.noData'])}
              height={300}
            />
          }
        />
      ) : (
        <CollapseTable
          loading={fetchSelectedKeyIdLoading || fetchServiceListLoading}
          rowKey={'svcId'}
          columns={listTableColumns}
          data={listTableData}
          expandedRowKeys={expandedIds}
          pagination={{
            position: ['bottomCenter'],
            showAllItems: true,
            current: page,
            pageSize: pageSize,
            onChange: (page) => setPage(page),
          }}
          paginationExtraContent={
            <Select
              options={pageSizeOptions.list}
              value={pageSize}
              onSelect={(value) => setPageSize(value)}
            />
          }
          onExpand={(expand, record) =>
            handleExpandCollapseTable(expand, record?.svcId)
          }
          scroll={{ y: 500 }}
        />
      )}
      <KeyModal
        open={openKeyPopup}
        onOk={(updatedData) => {
          handleSaveKey(updatedData);
        }}
        onCancel={() => setOpenKeyPopup(false)}
        value={selectedKey}
      />
      <CategoryModal
        open={openCategoryPopup}
        treeData={categoryTree}
        selectedData={selectedCategories}
        onOk={(selectedKeys) => {
          setSelectedCategories(selectedKeys);
          setOpenCategoryPopup(false);
        }}
        onCancel={() => {
          setOpenCategoryPopup(false);
        }}
        type={'radio'}
      />
      <Confirm
        open={subscribeConfirm.open}
        title={subscribeConfirm.title}
        desc={subscribeConfirm.desc}
        onOk={() => {
          subscribeConfirm.onConfirm();
          setSubscribeConfirm(defaultSubscribeConfirm);
        }}
        onCancel={() => {
          setSubscribeConfirm(defaultSubscribeConfirm);
        }}
        okText={intlObj.get(message['store.ok'])}
        cancelText={intlObj.get(message['store.cancel'])}
        hideCancel={subscribeConfirm.hideCancel}
      />
    </>
  );
};

export default Total;
