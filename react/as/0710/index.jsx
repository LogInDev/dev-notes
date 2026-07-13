// Key 타입 정렬 및 필터 우선순위
const KEY_TYPE_PRIORITY = {
  PSN: 1,
  SYS: 2,
};

// 구독 현황 정렬 및 필터 우선순위
const SUBSCRIPTION_STATUS_PRIORITY = {
  NOR: 1,
  SUBAPR: 2,
  SUBREJ: 3,
  REQAPR: 4,
  REQREJ: 5,
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
  CANCEL: 'CANCEL',
};

const DEFAULT_MY_SUBSCRIBE_FILTERS = {
  page: 1,
  pageSize: 10,
  svcType: 'all',
  subStatus: SUBSCRIBE_FILTER.SUB_NOR,
  selectedKeys: [],
};

const DEFAULT_SORT_FILTER = 'upd_dttm';

/**
 * 테이블 행 고유키
 *
 * subId가 존재하면 subId를 우선 사용한다.
 * subId가 없다면 svcId + keyId 조합을 사용한다.
 */
const getSubscribeRowKey = (record) => {
  if (record?.subId !== null && record?.subId !== undefined) {
    return String(record.subId);
  }

  return `${record?.svcId ?? ''}__${record?.keyId ?? ''}`;
};

const isSubscribing = (record) => record?.subStatCd === 'NOR';

const getSubscriptionStatus = (record) => {
  const subStatCd = record?.subStatCd;
  const reqStatCd = record?.reqStatCd;

  if (subStatCd && subStatCd !== 'NONE') {
    if (subStatCd === 'APR') return 'SUBAPR';
    if (subStatCd === 'REJ') return 'SUBREJ';

    return subStatCd;
  }

  if (reqStatCd && reqStatCd !== 'NONE') {
    if (reqStatCd === 'APR') return 'REQAPR';
    if (reqStatCd === 'REJ') return 'REQREJ';

    return reqStatCd;
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

  /**
   * 다른 화면으로 이동했다가 돌아와도 유지할 목록 필터
   */
  const [listFilters, setListFilters] = useListState(
    SUBSCRIBE_LIST_ID,
    DEFAULT_MY_SUBSCRIBE_FILTERS,
  );

  const {
    page = 1,
    pageSize = 10,
    svcType = 'all',
    subStatus = SUBSCRIBE_FILTER.SUB_NOR,
    selectedKeys = [],
  } = listFilters;

  const mySubscribeState =
    useSelector((state) => state.get('mySubscribe')) || {};

  // 목록 상태
  const mySubscribeListState = mySubscribeState?.list || {};
  const mySubscribeList =
    mySubscribeListState?.mySubscribeList || [];

  const fetchMySubscribeListLoading =
    mySubscribeListState?.fetchMySubscribeListLoading || false;

  const total =
    mySubscribeListState?.total ?? mySubscribeList.length;

  // 통계 상태
  const mySubscribeStatisticsState =
    mySubscribeState?.statistics || {};

  const mySubscribeStatistics =
    mySubscribeStatisticsState?.mySubscribeStatistics || {};

  const fetchMySubscribeStatisticsLoading =
    mySubscribeStatisticsState?.fetchMySubscribeStatisticsLoading || false;

  // 구독 취소 상태
  const cancelPopupState =
    mySubscribeState?.popup?.cancel || {};

  const cancelSubscriptionSuccess =
    cancelPopupState?.cancelSubscriptionSuccess || false;

  const [openKeyPopup, setOpenKeyPopup] = useState(false);

  /**
   * 현재 선택한 테이블 행의 고유키 목록
   *
   * API 데이터 자체를 저장하지 않고 고유키만 저장하여
   * 데이터 갱신 후 오래된 객체가 남는 문제를 방지한다.
   */
  const [checkedRowKeys, setCheckedRowKeys] = useState([]);

  /**
   * KeyModal에서 선택한 Key 기준 프론트 필터
   *
   * 서비스 타입과 구독 상태는 서버 요청 파라미터로 전달하고,
   * Key 선택은 현재 응답 목록에 적용한다.
   *
   * 백엔드에서 keyIds 필터를 지원한다면 이 필터도 API 파라미터로
   * 이동하는 것이 더 좋다.
   */
  const filteredMySubscribeList = useMemo(() => {
    if (!Array.isArray(mySubscribeList)) {
      return [];
    }

    if (selectedKeys.length === 0) {
      return mySubscribeList;
    }

    return mySubscribeList.filter((item) =>
      selectedKeys.some(
        (key) => String(key?.keyId) === String(item?.keyId),
      ),
    );
  }, [mySubscribeList, selectedKeys]);

  /**
   * 현재 화면에서 구독 취소가 가능한 행
   *
   * subStatCd === NOR인 구독 중 행만 취소 가능하다.
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

  const hasCheckedSubscription =
    checkedCancelableRows.length > 0;

  /**
   * 서비스 타입, 구독 상태, 페이지 조건에 따라 서버에서 목록 재조회
   */
  useEffect(() => {
    dispatch(
      fetchMySubscribeList({
        filter: DEFAULT_SORT_FILTER,
        svcType,
        subStatus,
        page,
        pageSize,
      }),
    );
  }, [
    dispatch,
    svcType,
    subStatus,
    page,
    pageSize,
  ]);

  /**
   * 통계는 화면 최초 진입 시 조회
   */
  useEffect(() => {
    dispatch(fetchMySubscribeStatistics('all'));
  }, [dispatch]);

  /**
   * 목록 또는 Key 필터가 변경되면
   * 현재 화면에서 유효하지 않은 체크값 제거
   */
  useEffect(() => {
    setCheckedRowKeys((prev) =>
      prev.filter((rowKey) =>
        cancelableRowKeys.includes(rowKey),
      ),
    );
  }, [cancelableRowKeys]);

  /**
   * 구독 취소 성공 후 현재 필터 조건으로 목록과 통계 재조회
   */
  useEffect(() => {
    if (!cancelSubscriptionSuccess) {
      return;
    }

    setCheckedRowKeys([]);

    dispatch(initSubscribeState());
    dispatch(fetchMySubscribeStatistics('all'));

    dispatch(
      fetchMySubscribeList({
        filter: DEFAULT_SORT_FILTER,
        svcType,
        subStatus,
        page,
        pageSize,
      }),
    );
  }, [
    cancelSubscriptionSuccess,
    dispatch,
    svcType,
    subStatus,
    page,
    pageSize,
  ]);

  // 프로젝트 필터
  const projectFilters = useMemo(
    () =>
      generateFiltersFromData(
        filteredMySubscribeList,
        'prjId',
      ),
    [filteredMySubscribeList],
  );

  // Key 타입 필터
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

  // Key 연계 정보 필터
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

    for (const item of sortedList) {
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
    }

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

  // 구독 현황 테이블 필터
  const statusFilters = useMemo(() => {
    const subStatusList = generateFiltersFromData(
      filteredMySubscribeList,
      'subStatCd',
      {
        NOR: intlObj.get(message['store.subscribing']),
        APR: intlObj.get(message['store.subReq']),
        REJ: intlObj.get(message['store.subRej']),
      },
    )
      .filter(
        (item) =>
          item?.value !== 'NONE' &&
          item?.value !== undefined,
      )
      .map(({ text, value }) => ({
        text,
        value:
          value === 'APR'
            ? 'SUBAPR'
            : value === 'REJ'
              ? 'SUBREJ'
              : value,
      }));

    const reqStatusList = generateFiltersFromData(
      filteredMySubscribeList,
      'reqStatCd',
      {
        APR: intlObj.get(message['store.permissionReq']),
        REJ: intlObj.get(message['store.permissionRej']),
      },
    )
      .filter(
        (item) =>
          item?.value !== 'NONE' &&
          item?.value !== undefined,
      )
      .map(({ text, value }) => ({
        text,
        value:
          value === 'APR'
            ? 'REQAPR'
            : value === 'REJ'
              ? 'REQREJ'
              : value,
      }));

    return [...subStatusList, ...reqStatusList].sort(
      (a, b) =>
        compareWithPriority(
          a?.value,
          b?.value,
          'ascend',
          SUBSCRIPTION_STATUS_PRIORITY,
        ),
    );
  }, [filteredMySubscribeList]);

  const updateListFilters = useCallback(
    (updatedFilters) => {
      setListFilters((prev) => ({
        ...prev,
        ...updatedFilters,
      }));
    },
    [setListFilters],
  );

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
        subStatus: selectedValue,
        page: 1,
      });

      setCheckedRowKeys([]);
    },
    [updateListFilters],
  );

  /**
   * 우측 상단 권한 승인 대기 버튼
   *
   * 1. 두 번째 Select 값을 AUTH_APR로 변경
   * 2. useEffect에서 AUTH_APR 파라미터로 목록 재조회
   */
  const handlePendingPermissionClick = useCallback(() => {
    handleMySubscribeChange(
      SUBSCRIBE_FILTER.AUTH_APR,
    );
  }, [handleMySubscribeChange]);

  /**
   * 우측 상단 구독 승인 대기 버튼
   *
   * 1. 두 번째 Select 값을 SUB_APR로 변경
   * 2. useEffect에서 SUB_APR 파라미터로 목록 재조회
   */
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
    [
      selectedKeys,
      updateListFilters,
    ],
  );

  const handleKeyModalConfirm = useCallback(
    (updatedData) => {
      updateListFilters({
        selectedKeys: updatedData || [],
        page: 1,
      });

      setCheckedRowKeys([]);
      setOpenKeyPopup(false);
    },
    [updateListFilters],
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
    (id) => {
      if (!id) return;

      navigate(
        getRoutePath(
          basename,
          `/api/detail/${id}`,
        ),
      );
    },
    [
      navigate,
      basename,
    ],
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
    (id, keyId, keyName) => {
      if (!id) return;

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
          `/dashboard/detail/${id}`,
        ),
      );
    },
    [
      navigate,
      basename,
    ],
  );

  /**
   * 헤더 체크박스
   *
   * 현재 필터링된 목록 중 구독 중인 행만 선택한다.
   */
  const handleCheckAllSubscription = useCallback(
    (checked) => {
      if (checked) {
        setCheckedRowKeys(cancelableRowKeys);
        return;
      }

      setCheckedRowKeys([]);
    },
    [cancelableRowKeys],
  );

  /**
   * 행 체크박스
   */
  const handleCheckSubscription = useCallback(
    (checked, record) => {
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

  /**
   * 구독 취소 버튼
   *
   * 체크된 구독 중 행이 없으면 실행되지 않는다.
   */
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
  }, [
    dispatch,
    checkedCancelableRows,
  ]);

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
        filters: keyInfoFilters,
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
        showSorterTooltip: false,
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
        showSorterTooltip: false,
        sorter: (a, b, order) =>
          compareString(
            a?.updDttm,
            b?.updDttm,
            order,
          ),
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
        showSorterTooltip: false,
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
          const subStatCd = record?.subStatCd;
          const reqStatCd = record?.reqStatCd;

          if (subStatCd === 'NOR') {
            return intlObj.get(
              message['store.subscribing'],
            );
          }

          if (subStatCd === 'APR') {
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

          if (subStatCd === 'REJ') {
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

          if (reqStatCd === 'APR') {
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

          if (reqStatCd === 'REJ') {
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
        showSorterTooltip: false,
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
        resize: true,
        align: 'center',
        render: (_, record) => {
          /**
           * 구독 중이 아닌 행은 체크박스를
           * disabled로 표시하지 않고 아예 숨긴다.
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

          <Divide
            $border={true}
            top={15}
            bottom={15}
          />

          <Division
            flex={true}
            justifyContent="space-between"
          >
            <Division
              flex={true}
              gap={10}
            >
              <Select
                width={180}
                placeholder={intlObj.get(
                  message['store.filter.service'],
                )}
                value={svcType}
                options={svcTypeOptions}
                onChange={
                  handleSvcTypeChange
                }
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
        </Spin>

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

// export const getMySubscribeOptions = () => [
//   {
//     label: intlObj.get(
//       message['store.totalList'],
//     ),
//     value: 'ALL',
//   },
//   {
//     label: intlObj.get(
//       message['store.subscribing'],
//     ),
//     value: 'SUB_NOR',
//   },
//   {
//     label: intlObj.get(
//       message['store.pendingSubApr'],
//     ),
//     value: 'SUB_APR',
//   },
//   {
//     label: intlObj.get(
//       message['store.subRej'],
//     ),
//     value: 'SUB_REJ',
//   },
//   {
//     label: intlObj.get(
//       message['store.pendingReqApr'],
//     ),
//     value: 'AUTH_APR',
//   },
//   {
//     label: intlObj.get(
//       message['store.permissionRej'],
//     ),
//     value: 'AUTH_REJ',
//   },
// ];
