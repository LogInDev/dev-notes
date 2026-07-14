const KEY_TYPE_PRIORITY = {
  PSN: 1,
  SYS: 2,
};

const SUBSCRIPTION_STATUS_PRIORITY = {
  SUB_NOR: 1,
  SUB_APR: 2,
  SUB_REJ: 3,
  AUTH_APR: 4,
  AUTH_REJ: 5,
};

const SUBSCRIBE_FILTER = {
  ALL: 'ALL',
  SUB_NOR: 'SUB_NOR',
  SUB_APR: 'SUB_APR',
  SUB_REJ: 'SUB_REJ',
  AUTH_APR: 'AUTH_APR',
  AUTH_REJ: 'AUTH_REJ',
};

const SUBSCRIBE_POPUP_KEY = {
  SUB_PENDING: 'APR',
  AUTH_PENDING: 'RQP',
  SUB_REJECTED: 'REJ',
  AUTH_REJECTED: 'RJP',

  // 프로젝트의 실제 구독 취소 팝업 key가 다르면 이 값만 변경
  CANCEL: 'CANCEL',
};

const DEFAULT_MY_SUBSCRIBE_FILTERS = {
  page: 1,
  pageSize: 10,
  svcType: 'all',
  subStatus: SUBSCRIBE_FILTER.SUB_NOR,
  selectedKeys: [],
};

const getSubscribeRowKey = (record) => {
  if (record?.subId != null) {
    return `SUB_${record.subId}`;
  }

  if (record?.reqId != null) {
    return `REQ_${record.reqId}`;
  }

  return [
    record?.svcId ?? '',
    record?.keyId ?? '',
    record?.subStatCd ?? '',
    record?.reqStatCd ?? '',
  ].join('_');
};

const isSubscribing = (record) =>
  record?.subStatCd === SUBSCRIBE_FILTER.SUB_NOR;

const getSubscriptionStatus = (record) => {
  if (record?.subStatCd && record.subStatCd !== 'NONE') {
    return record.subStatCd;
  }

  if (record?.reqStatCd && record.reqStatCd !== 'NONE') {
    return record.reqStatCd;
  }

  return undefined;
};

const MySubscribe = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  const pageSizeOptions = useMemo(
    () => [
      {
        label: intlObj.get(message['store.pageSize10']),
        value: 10,
      },
      {
        label: intlObj.get(message['store.pageSize30']),
        value: 30,
      },
      {
        label: intlObj.get(message['store.pageSize50']),
        value: 50,
      },
    ],
    [],
  );

  const svcTypeOptions = useMemo(() => getSvcTypeOptions(), []);
  const mySubscribeOptions = useMemo(() => getMySubscribeOptions(), []);

  const [listFilters, setListFilters] = useListState(
    SUBSCRIBE_LIST_ID,
    DEFAULT_MY_SUBSCRIBE_FILTERS,
  );

  /*
   * useState로 같은 필터를 다시 관리하지 않는다.
   * useListState가 화면 표시값, 세션 저장값, API 요청값의 원본이다.
   */
  const {
    page = 1,
    pageSize = 10,
    svcType = 'all',
    subStatus = SUBSCRIBE_FILTER.SUB_NOR,
    selectedKeys = [],
  } = listFilters || DEFAULT_MY_SUBSCRIBE_FILTERS;

  const mySubscribeState =
    useSelector((state) => state.get('mySubscribe')) || {};

  const mySubscribeListState = mySubscribeState?.list || {};
  const mySubscribeList = Array.isArray(
    mySubscribeListState?.mySubscribeList,
  )
    ? mySubscribeListState.mySubscribeList
    : [];

  const fetchMySubscribeListLoading =
    mySubscribeListState?.fetchMySubscribeListLoading || false;

  const total = Number(
    mySubscribeListState?.total ?? mySubscribeList.length,
  );

  const mySubscribeStatisticsState =
    mySubscribeState?.statistics || {};

  const mySubscribeStatistics =
    mySubscribeStatisticsState?.mySubscribeStatistics || {};

  const fetchMySubscribeStatisticsLoading =
    mySubscribeStatisticsState?.fetchMySubscribeStatisticsLoading || false;

  const cancelPopupState =
    mySubscribeState?.popup?.cancel || {};

  const cancelSubscriptionSuccess =
    cancelPopupState?.cancelSubscriptionSuccess || false;

  const [openKeyPopup, setOpenKeyPopup] = useState(false);
  const [checkedRowKeys, setCheckedRowKeys] = useState([]);

  const updateListFilters = useCallback(
    (updatedFilters) => {
      setListFilters((prev) => ({
        ...DEFAULT_MY_SUBSCRIBE_FILTERS,
        ...(prev || {}),
        ...updatedFilters,
      }));
    },
    [setListFilters],
  );

  /*
   * 서비스 타입과 구독 상태는 백엔드에서 필터링한다.
   * Key 선택은 현재 응답에서 추가 필터링한다.
   */
  const filteredMySubscribeList = useMemo(() => {
    if (selectedKeys.length === 0) {
      return mySubscribeList;
    }

    return mySubscribeList.filter((item) =>
      selectedKeys.some(
        (key) => String(key?.keyId) === String(item?.keyId),
      ),
    );
  }, [mySubscribeList, selectedKeys]);

  /*
   * 현재 목록 중 SUB_NOR인 행만 취소 가능
   */
  const cancelableRows = useMemo(
    () => filteredMySubscribeList.filter(isSubscribing),
    [filteredMySubscribeList],
  );

  const cancelableRowKeys = useMemo(
    () => cancelableRows.map(getSubscribeRowKey),
    [cancelableRows],
  );

  const checkedCancelableRows = useMemo(
    () =>
      cancelableRows.filter((record) =>
        checkedRowKeys.includes(getSubscribeRowKey(record)),
      ),
    [cancelableRows, checkedRowKeys],
  );

  const isAllCancelableChecked =
    cancelableRowKeys.length > 0 &&
    cancelableRowKeys.every((rowKey) =>
      checkedRowKeys.includes(rowKey),
    );

  const isSomeCancelableChecked =
    cancelableRowKeys.some((rowKey) =>
      checkedRowKeys.includes(rowKey),
    ) && !isAllCancelableChecked;

  /*
   * 버튼 활성화는 선택 가능한 실제 행 기준
   */
  const hasCheckedSubscription =
    checkedCancelableRows.length > 0;

  /*
   * 필터 변경 시 서버 목록 재조회
   */
  useEffect(() => {
    dispatch(
      fetchMySubscribeList({
        svcType,
        subStatus,
      }),
    );
  }, [dispatch, svcType, subStatus]);

  /*
   * 서비스 타입별 통계가 필요하면 svcType 변경 시 재조회
   */
  useEffect(() => {
    dispatch(fetchMySubscribeStatistics(svcType));
  }, [dispatch, svcType]);

  /*
   * 목록이 변경되면 더 이상 존재하지 않거나
   * 취소할 수 없는 체크값을 제거
   */
  useEffect(() => {
    setCheckedRowKeys((prev) =>
      prev.filter((rowKey) =>
        cancelableRowKeys.includes(rowKey),
      ),
    );
  }, [cancelableRowKeys]);

  /*
   * 구독 취소 성공 후 현재 필터로 재조회
   */
  useEffect(() => {
    if (!cancelSubscriptionSuccess) {
      return;
    }

    setCheckedRowKeys([]);

    dispatch(initSubscribeState());
    dispatch(fetchMySubscribeStatistics(svcType));

    dispatch(
      fetchMySubscribeList({
        svcType,
        subStatus,
      }),
    );
  }, [
    cancelSubscriptionSuccess,
    dispatch,
    svcType,
    subStatus,
  ]);

  const projectFilters = useMemo(
    () =>
      generateFiltersFromData(
        filteredMySubscribeList,
        'prjId',
      ),
    [filteredMySubscribeList],
  );

  const keyTypeFilters = useMemo(() => {
    const filters = generateFiltersFromData(
      filteredMySubscribeList,
      'authCd',
      {
        SYS: intlObj.get(message['store.system']),
        PSN: intlObj.get(message['store.personal']),
      },
    );

    return [...filters].sort((a, b) =>
      compareWithPriority(
        a?.value,
        b?.value,
        'ascend',
        KEY_TYPE_PRIORITY,
      ),
    );
  }, [filteredMySubscribeList]);

  const keyInfoFilters = useMemo(() => {
    const filters = new Set();

    const sortedList = [...filteredMySubscribeList].sort(
      (a, b) =>
        compareWithPriority(
          a?.authCd,
          b?.authCd,
          'ascend',
          KEY_TYPE_PRIORITY,
        ),
    );

    sortedList.forEach((item) => {
      if (item?.authCd === 'PSN') {
        filters.add(
          item?.nameKor && item?.empNo
            ? `${item.nameKor} (${item.empNo})`
            : '-',
        );
      }

      if (item?.authCd === 'SYS') {
        filters.add(item?.appNm || '-');
      }
    });

    return [...filters]
      .sort((a, b) => {
        if (a === '-' && b !== '-') return 1;
        if (b === '-' && a !== '-') return -1;

        return String(a).localeCompare(String(b));
      })
      .map((value) => ({
        text: value,
        value,
      }));
  }, [filteredMySubscribeList]);

  const statusFilters = useMemo(() => {
    const statusMap = {
      [SUBSCRIBE_FILTER.SUB_NOR]: intlObj.get(
        message['store.subscribing'],
      ),
      [SUBSCRIBE_FILTER.SUB_APR]: intlObj.get(
        message['store.subReq'],
      ),
      [SUBSCRIBE_FILTER.SUB_REJ]: intlObj.get(
        message['store.subRej'],
      ),
      [SUBSCRIBE_FILTER.AUTH_APR]: intlObj.get(
        message['store.permissionReq'],
      ),
      [SUBSCRIBE_FILTER.AUTH_REJ]: intlObj.get(
        message['store.permissionRej'],
      ),
    };

    const values = new Set();

    filteredMySubscribeList.forEach((record) => {
      const status = getSubscriptionStatus(record);

      if (status && status !== 'NONE') {
        values.add(status);
      }
    });

    return [...values]
      .sort((a, b) =>
        compareWithPriority(
          a,
          b,
          'ascend',
          SUBSCRIPTION_STATUS_PRIORITY,
        ),
      )
      .map((value) => ({
        text: statusMap[value] || value,
        value,
      }));
  }, [filteredMySubscribeList]);

  const handleSvcTypeChange = useCallback(
    (selectedValue) => {
      updateListFilters({
        svcType: selectedValue,
        page: 1,
      });

      setCheckedRowKeys([]);
    },
    [updateListFilters],
  );

  const handleMySubscribeChange = useCallback(
    (selectedValue) => {
      updateListFilters({
        /*
         * substatus가 아니라 반드시 subStatus
         */
        subStatus: selectedValue,
        page: 1,
      });

      setCheckedRowKeys([]);
    },
    [updateListFilters],
  );

  const handlePendingPermissionClick = useCallback(() => {
    handleMySubscribeChange(
      SUBSCRIBE_FILTER.AUTH_APR,
    );
  }, [handleMySubscribeChange]);

  const handlePendingSubscriptionClick = useCallback(() => {
    handleMySubscribeChange(
      SUBSCRIBE_FILTER.SUB_APR,
    );
  }, [handleMySubscribeChange]);

  const handlePageChange = useCallback(
    (nextPage) => {
      updateListFilters({
        page: nextPage,
      });
    },
    [updateListFilters],
  );

  const handlePageSizeChange = useCallback(
    (nextPageSize) => {
      updateListFilters({
        page: 1,
        pageSize: nextPageSize,
      });

      setCheckedRowKeys([]);
    },
    [updateListFilters],
  );

  const handleKeyModalConfirm = useCallback(
    (updatedData) => {
      updateListFilters({
        selectedKeys: Array.isArray(updatedData)
          ? updatedData
          : [],
        page: 1,
      });

      setCheckedRowKeys([]);
      setOpenKeyPopup(false);
    },
    [updateListFilters],
  );

  const handleRemoveKey = useCallback(
    (keyName) => {
      const nextSelectedKeys = selectedKeys.filter(
        (item) => item?.keyName !== keyName,
      );

      updateListFilters({
        selectedKeys: nextSelectedKeys,
        page: 1,
      });

      setCheckedRowKeys([]);
    },
    [selectedKeys, updateListFilters],
  );

  const handleUpdateKeyState = useCallback(
    (field, updatedData) => {
      dispatch(
        updateKeyField({
          field,
          value: updatedData,
        }),
      );
    },
    [dispatch],
  );

  const handleNavigateToDetail = useCallback(
    (svcId) => {
      if (!svcId) return;

      navigate(
        getRoutePath(
          basename,
          `/api/detail/${svcId}`,
        ),
      );
    },
    [navigate, basename],
  );

  const handleOpenSubscribePopup = useCallback(
    (key, record) => {
      dispatch(
        updateOpenPopupSub({
          open: true,
          key,
          selectedItem:
            record !== undefined
              ? [record]
              : undefined,
        }),
      );
    },
    [dispatch],
  );

  const navigateToDashboardDetail = useCallback(
    (svcId, keyId, keyName) => {
      if (!svcId) return;

      localStorage.setItem(
        'apiInfo',
        JSON.stringify({
          keyId,
          keyName,
        }),
      );

      navigate(
        getRoutePath(
          basename,
          `/dashboard/detail/${svcId}`,
        ),
      );
    },
    [navigate, basename],
  );

  const handleCheckAllSubscription = useCallback(
    (checked) => {
      setCheckedRowKeys(
        checked ? cancelableRowKeys : [],
      );
    },
    [cancelableRowKeys],
  );

  const handleCheckSubscription = useCallback(
    (checked, record) => {
      if (!isSubscribing(record)) {
        return;
      }

      const rowKey = getSubscribeRowKey(record);

      setCheckedRowKeys((prev) => {
        if (checked) {
          return prev.includes(rowKey)
            ? prev
            : [...prev, rowKey];
        }

        return prev.filter(
          (key) => key !== rowKey,
        );
      });
    },
    [],
  );

  const handleCancelSubscriptionClick = useCallback(() => {
    if (checkedCancelableRows.length === 0) {
      return;
    }

    dispatch(
      updateOpenPopupSub({
        open: true,
        key: SUBSCRIBE_POPUP_KEY.CANCEL,
        selectedItem: checkedCancelableRows,
      }),
    );
  }, [dispatch, checkedCancelableRows]);

  const tableColumns = useMemo(
    () => [
      {
        title: intlObj.get(message['store.svcType']),
        dataIndex: 'svcType',
        key: 'svcType',
        width: '8%',
        resize: true,
        ellipsis: true,
        align: 'center',
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            a?.svcType,
            b?.svcType,
            order,
          ),
        render: (_, record) => (
          <Tag.SvcTypeTag
            svcType={record?.svcType}
          />
        ),
        onCell: (record) => ({
          onClick: (event) => {
            event.stopPropagation();
            handleNavigateToDetail(record?.svcId);
          },
        }),
      },
      {
        title: intlObj.get(message['store.keyName']),
        dataIndex: 'keyName',
        key: 'keyName',
        width: '15%',
        resize: true,
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            a?.keyName,
            b?.keyName,
            order,
          ),
        render: (text) => text || '-',
      },
      {
        title: intlObj.get(message['store.project']),
        dataIndex: 'prjId',
        key: 'prjId',
        width: '10%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            a?.prjId,
            b?.prjId,
            order,
          ),
        filters: projectFilters,
        onFilter: (value, record) =>
          onFilter(value, record?.prjId),
        render: (text) => text || '-',
      },
      {
        title: intlObj.get(message['store.keyType']),
        dataIndex: 'authCd',
        key: 'authCd',
        width: '10%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            a?.authCd,
            b?.authCd,
            order,
          ),
        filters: keyTypeFilters,
        onFilter: (value, record) =>
          onFilter(value, record?.authCd),
        render: (_, record) => {
          if (record?.authCd === 'SYS') {
            return intlObj.get(
              message['store.system'],
            );
          }

          if (record?.authCd === 'PSN') {
            return intlObj.get(
              message['store.personal'],
            );
          }

          return '-';
        },
      },
      {
        title: intlObj.get(
          message['store.keyConnectionInfo'],
        ),
        dataIndex: 'appNm',
        key: 'keyConnectionInfo',
        width: '10%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        filters: keyInfoFilters,
        sorter: (a, b, order) => {
          if (a?.authCd === b?.authCd) {
            if (a?.authCd === 'PSN') {
              const first =
                a?.nameKor && a?.empNo
                  ? `${a.nameKor}${a.empNo}`
                  : undefined;

              const second =
                b?.nameKor && b?.empNo
                  ? `${b.nameKor}${b.empNo}`
                  : undefined;

              return compareString(
                first,
                second,
                order,
              );
            }

            if (a?.authCd === 'SYS') {
              return compareString(
                a?.appNm,
                b?.appNm,
                order,
              );
            }
          }

          return compareWithPriority(
            a?.authCd,
            b?.authCd,
            order,
            KEY_TYPE_PRIORITY,
          );
        },
        onFilter: (value, record) => {
          if (record?.authCd === 'PSN') {
            const keyInfo =
              record?.nameKor && record?.empNo
                ? `${record.nameKor} (${record.empNo})`
                : '-';

            return onFilter(value, keyInfo);
          }

          if (record?.authCd === 'SYS') {
            return onFilter(
              value,
              record?.appNm || '-',
            );
          }

          return false;
        },
        render: (_, record) => {
          if (record?.authCd === 'PSN') {
            return record?.nameKor && record?.empNo
              ? `${record.nameKor} (${record.empNo})`
              : '-';
          }

          if (record?.authCd === 'SYS') {
            return record?.appNm || '-';
          }

          return '-';
        },
      },
      {
        title: intlObj.get(
          message['store.apiServiceName'],
        ),
        dataIndex: 'svcNm',
        key: 'svcNm',
        width: 'auto',
        resize: true,
        ellipsis: true,
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            a?.svcNm,
            b?.svcNm,
            order,
          ),
        render: (text, record) => (
          <>
            {text || '-'}

            {record?.svcType === 'LLM' &&
              record?.svcModel && (
                <>
                  <br />
                  <ModelName size="small">
                    {record.svcModel}
                  </ModelName>
                </>
              )}
          </>
        ),
      },
      {
        title: intlObj.get(message['store.subCount']),
        dataIndex: 'subCount',
        key: 'subCount',
        width: '6%',
        resize: true,
        align: 'center',
        ellipsis: true,
        sorter: (a, b, order) =>
          compareNumber(
            a?.subCount,
            b?.subCount,
            order,
          ),
        render: (text) => text ?? '-',
      },
      {
        title: intlObj.get(message['store.updDttm']),
        dataIndex: 'updDttm',
        key: 'updDttm',
        width: '10%',
        resize: true,
        align: 'center',
        ellipsis: true,
        sorter: (a, b, order) =>
          compareString(
            a?.updDttm,
            b?.updDttm,
            order,
          ),

        /*
         * 기존 코드에는 return이 빠져 있었다.
         */
        render: (text) =>
          text
            ? dayjs(text).format('YYYY.MM.DD')
            : '-',
      },
      {
        title: intlObj.get(message['store.subStatus']),
        key: 'subscriptionStatus',
        width: '9%',
        resize: true,
        align: 'center',
        ellipsis: true,
        sorter: (a, b, order) =>
          compareWithPriority(
            getSubscriptionStatus(a),
            getSubscriptionStatus(b),
            order,
            SUBSCRIPTION_STATUS_PRIORITY,
          ),
        filters: statusFilters,
        onFilter: (value, record) =>
          onFilter(
            value,
            getSubscriptionStatus(record),
          ),
        render: (_, record) => {
          const status = getSubscriptionStatus(record);

          if (status === SUBSCRIBE_FILTER.SUB_NOR) {
            return intlObj.get(
              message['store.subscribing'],
            );
          }

          if (status === SUBSCRIBE_FILTER.SUB_APR) {
            return (
              <Buttons.ColorFilled
                type="primary"
                size="small"
                onClick={() =>
                  handleOpenSubscribePopup(
                    SUBSCRIBE_POPUP_KEY.SUB_PENDING,
                    record,
                  )
                }
              >
                {intlObj.get(
                  message['store.subReq'],
                )}
              </Buttons.ColorFilled>
            );
          }

          if (status === SUBSCRIBE_FILTER.SUB_REJ) {
            return (
              <Buttons.ColorFilled
                type="orange"
                size="small"
                onClick={() =>
                  handleOpenSubscribePopup(
                    SUBSCRIBE_POPUP_KEY.SUB_REJECTED,
                    record,
                  )
                }
              >
                {intlObj.get(
                  message['store.subRej'],
                )}
              </Buttons.ColorFilled>
            );
          }

          if (status === SUBSCRIBE_FILTER.AUTH_APR) {
            return (
              <Buttons.ColorFilled
                type="skyblue"
                size="small"
                onClick={() =>
                  handleOpenSubscribePopup(
                    SUBSCRIBE_POPUP_KEY.AUTH_PENDING,
                    record,
                  )
                }
              >
                {intlObj.get(
                  message['store.permissionReq'],
                )}
              </Buttons.ColorFilled>
            );
          }

          if (status === SUBSCRIBE_FILTER.AUTH_REJ) {
            return (
              <Buttons.ColorFilled
                type="red"
                size="small"
                onClick={() =>
                  handleOpenSubscribePopup(
                    SUBSCRIBE_POPUP_KEY.AUTH_REJECTED,
                    record,
                  )
                }
              >
                {intlObj.get(
                  message['store.permissionRej'],
                )}
              </Buttons.ColorFilled>
            );
          }

          return '-';
        },
        onCell: () => ({
          onClick: (event) =>
            event.stopPropagation(),
        }),
      },
      {
        title: '모니터링',
        key: 'monitoring',
        width: '6%',
        align: 'center',
        render: (_, record) => {
          if (!isSubscribing(record)) {
            return null;
          }

          return (
            <img
              src={icon_monitoring}
              alt="icon_monitoring"
              style={{
                cursor: 'pointer',
              }}
              onClick={(event) => {
                event.stopPropagation();

                navigateToDashboardDetail(
                  record?.svcId,
                  record?.keyId,
                  record?.keyName,
                );
              }}
            />
          );
        },
        onCell: () => ({
          onClick: (event) =>
            event.stopPropagation(),
        }),
      },
      {
        title: () => (
          <Checkbox
            disabled={
              cancelableRowKeys.length === 0
            }
            checked={isAllCancelableChecked}
            indeterminate={
              isSomeCancelableChecked
            }
            onClick={(event) =>
              event.stopPropagation()
            }
            onChange={(event) =>
              handleCheckAllSubscription(
                event.target.checked,
              )
            }
          />
        ),
        key: 'cancelCheckbox',
        width: '6%',
        align: 'center',
        render: (_, record) => {
          /*
           * 구독 중이 아니면 체크박스 자체를 표시하지 않는다.
           */
          if (!isSubscribing(record)) {
            return null;
          }

          const rowKey =
            getSubscribeRowKey(record);

          return (
            <Checkbox
              checked={checkedRowKeys.includes(
                rowKey,
              )}
              onClick={(event) =>
                event.stopPropagation()
              }
              onChange={(event) =>
                handleCheckSubscription(
                  event.target.checked,
                  record,
                )
              }
            />
          );
        },
        onCell: () => ({
          onClick: (event) =>
            event.stopPropagation(),
        }),
      },
    ],
    [
      projectFilters,
      keyTypeFilters,
      keyInfoFilters,
      statusFilters,
      cancelableRowKeys,
      checkedRowKeys,
      isAllCancelableChecked,
      isSomeCancelableChecked,
      handleNavigateToDetail,
      handleOpenSubscribePopup,
      navigateToDashboardDetail,
      handleCheckAllSubscription,
      handleCheckSubscription,
    ],
  );

  const isLoading =
    fetchMySubscribeListLoading ||
    fetchMySubscribeStatisticsLoading;

  return (
    <PageLayout>
      <Header />

      <PageLayout.Article>
        <Divide
          $border={false}
          top={10}
          bottom={0}
        />

        <Spin spinning={isLoading}>
          <Division
            flex={true}
            justifyContent="flex-end"
            gap={10}
          >
            <Buttons.Outlined
              type="primary"
              minWidth={76}
              onClick={
                handlePendingPermissionClick
              }
            >
              {intlObj.get(
                message['store.pendingReqApr'],
              )}{' '}
              {mySubscribeStatistics?.rasCnt ?? 0}{' '}
              {intlObj.get(
                message['store.unit.count'],
              )}
            </Buttons.Outlined>

            <Buttons.Outlined
              type="primary"
              minWidth={76}
              onClick={
                handlePendingSubscriptionClick
              }
            >
              {intlObj.get(
                message['store.pendingSubApr'],
              )}{' '}
              {mySubscribeStatistics?.aprCnt ?? 0}{' '}
              {intlObj.get(
                message['store.unit.count'],
              )}
            </Buttons.Outlined>

            <Buttons.Outlined
              type="primary"
              minWidth={76}
              disabled={!hasCheckedSubscription}
              onClick={
                handleCancelSubscriptionClick
              }
            >
              {intlObj.get(
                message['store.menu.unsubscribe'],
              )}
            </Buttons.Outlined>
          </Division>
        </Spin>

        <Divide
          $border={true}
          top={15}
          bottom={15}
        />

        <Division
          flex={true}
          justifyContent="space-between"
        >
          <Division flex={true} gap={10}>
            <Select
              width={180}
              placeholder={intlObj.get(
                message['store.filter.service'],
              )}
              value={svcType}
              options={svcTypeOptions}
              onChange={handleSvcTypeChange}
            />

            <Select
              width={180}
              placeholder={intlObj.get(
                message['store.subState'],
              )}
              value={subStatus}
              options={mySubscribeOptions}
              onChange={
                handleMySubscribeChange
              }
            />
          </Division>

          <Selector
            onClick={() =>
              setOpenKeyPopup(true)
            }
            onClear={handleRemoveKey}
            placeholder={intlObj.get(
              message['store.selectKey'],
            )}
            icon="key"
            width={300}
          >
            {selectedKeys.map(
              (key) => key?.keyName,
            )}
          </Selector>
        </Division>

        <Divide
          $border={false}
          top={15}
          bottom={15}
        />

        <Table
          rowKey={getSubscribeRowKey}
          loading={fetchMySubscribeListLoading}
          type="normal"
          columns={tableColumns}
          dataSource={
            filteredMySubscribeList
          }
          onRow={(record) => ({
            style: {
              cursor: 'pointer',
            },
            onClick: () => {
              localStorage.setItem(
                'apiStoreKey',
                record?.keyId,
              );

              handleUpdateKeyState(
                'selectedKeyId',
                record?.keyId,
              );

              handleNavigateToDetail(
                record?.svcId,
              );
            },
          })}
          pagination={{
            position: ['bottomCenter'],
            showAllItems: true,
            total,
            current: page,
            pageSize,
            onChange: handlePageChange,
          }}
          paginationExtraContent={
            <Select
              value={pageSize}
              options={pageSizeOptions}
              onSelect={(_, option) =>
                handlePageSizeChange(
                  option.value,
                )
              }
            />
          }
          scroll={{
            y: 500,
          }}
        />

        <KeyModal
          open={openKeyPopup}
          onOk={handleKeyModalConfirm}
          onCancel={() =>
            setOpenKeyPopup(false)
          }
          value={selectedKeys}
          type="checkbox"
        />

        <MySubscribePopup />
      </PageLayout.Article>
    </PageLayout>
  );
};

export default MySubscribe;

//내부에 prop 전달
// const Outlined = ({
//   disabled,
//   children,
//   ...props
// }) => {
//   return (
//     <Button
//       {...props}
//       disabled={disabled}
//     >
//       {children}
//     </Button>
//   );
// };

// const Outlined = styled.button`
//   &:disabled {
//     color: #999;
//     background-color: #f5f5f5;
//     border-color: #d9d9d9;
//     cursor: not-allowed;
//     opacity: 0.6;
//     pointer-events: none;
//   }
// `;
