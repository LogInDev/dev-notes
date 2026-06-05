import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { produce } from 'immer';
import dayjs from 'dayjs';
import axios from 'axios';

// 🌟 [수정] 고정 상수는 컴포넌트 외부로 이동 (리렌더링 시 필터 풀림 방지)
const subscriptionStatuspriority = { N: 1, NOR: 2, APR: 3 };
const svcTypeStatuspriority = { API: 1, LLM: 2, CTS: 3, DRM: 4, MCP: 5 };

const defaultPendingDrmSubscribe = {
  svcId: null,
  keyId: null,
  checkedApiList: [],
  autoAppr: 'N',
};

const Total = ({
  searchTerm,
  searchedTerm,
  useSortBy,
  useSelectedCategories,
}) => {
  const pageSizeOptions = {
    list: [
      { label: intlObj.get(message['store.pageSize10']), value: 10 },
      { label: intlObj.get(message['store.pageSize30']), value: 30 },
      { label: intlObj.get(message['store.pageSize50']), value: 50 },
    ],
    card: [
      { label: intlObj.get(message['store.pageSize9']), value: 9 },
      { label: intlObj.get(message['store.pageSize18']), value: 18 },
      { label: intlObj.get(message['store.pageSize27']), value: 27 },
    ],
  };
  
  const defaultSubscribeConfirm = {
    open: false,
    title: intlObj.get(message['store.subReq']),
    desc: '',
    onConfirm: () => {},
    hideCancel: true,
  };

  const { svcType } = useParams();
  const { addToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  const listState = useSelector((state) => state.get('list')) || {};
  const serviceList = listState?.serviceList || [];
  const fetchServiceListLoading = listState?.fetchServiceListLoading || false;
  const apiListByService = listState?.apiListByService || {};
  const fetchApiListByServiceLoading = listState?.fetchApiListByServiceLoading || false;

  // 카테고리 관련 상태
  const categoryState = useSelector((state) => state.get('category')) || {};
  const categories = categoryState?.categoryList || [];
  const categoryLanguage = categoryState?.language;
  const categoryTree = useMemo(
    () =>
      produce(categories, (draft) => {
        processCategoryForTree(draft, categoryLanguage);
      }),
    [categories, categoryLanguage],
  );

  const keyState = useSelector((state) => state.get('keySelect')) || {};
  const keyList = keyState?.keyList || [];
  const selectedKeyId = keyState?.selectedKeyId;
  const fetchSelectedKeyIdLoading = selectedKeyId === null;
  const selectedKey = useMemo(
    () => keyList.find((key) => key.keyId === selectedKeyId) || keyList[0],
    [keyList, selectedKeyId],
  );

  const profile = useSelector((state) => state.get('auth').get('profile'));
  const loginSysEmpNo = (profile?.EMP_NO || '').trim();
  const isLoginSysEmpNo = loginSysEmpNo.startsWith('X99');

  const detailPageState = useSelector((state) => state.get('detail')) || {};
  const drmEmpNoState = detailPageState?.drmEmpNo || {};
  const {
    verifyLoading = false,
    success: verifySuccess = false,
    result = null,
    error = null,
  } = drmEmpNoState;

  const [sortBy, setSortBy] = useSortBy;
  const [selectedCategories, setSelectedCategories] = useSelectedCategories;
  const [openKeyPopup, setOpenKeyPopup] = useState(false);
  const [openCategoryPopup, setOpenCategoryPopup] = useState(false);
  const [viewType, setViewType] = useState('card');
  const [expandedIds, setExpandedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [serviceSubscriptionPermission, setServiceSubscriptionPermission] = useState('NON');
  const [subscribeConfirm, setSubscribeConfirm] = useState(defaultSubscribeConfirm);

  const [pendingDrmSubscribeVerify, setPendingDrmSubscribeVerify] = useState(false);
  const [pendingDrmSubscribe, setPendingDrmSubscribe] = useState(defaultPendingDrmSubscribe);

  const verifyMessage = useMemo(() => {
    if (error?.message) {
      return error.message;
    }
    return getInvalidSysEmpNoWarningMsg(result, null);
  }, [result, error]);

  const selectedCategoryName = useMemo(
    () =>
      selectedCategories[0]
        ? categoryLanguage?.[findNodeByKey(categoryTree, selectedCategories[0])?.catId] || ''
        : '',
    [categoryTree, selectedCategories, categoryLanguage],
  );

  // 정렬 옵션
  const sortOptions = [
    {
      key: 'upd_dttm',
      label: intlObj.get(message['store.order.recent']),
      onClick: (item) => setSortBy(item.key),
    },
    {
      key: 'sub_count',
      label: intlObj.get(message['store.order.subCount']),
      onClick: (item) => setSortBy(item.key),
    },
    {
      key: 'vw_cnt',
      label: intlObj.get(message['store.order.viewCount']),
      onClick: (item) => setSortBy(item.key),
    },
  ];

  // 구독 상태 필터링 목록
  const statusFilters = useMemo(
    () =>
      generateFiltersFromData(serviceList, 'subStatCd', {
        N: intlObj.get(message['store.subReq']),
        NOR: intlObj.get(message['store.subscribing']),
        APR: intlObj.get(message['store.pendingApr']),
      })
        .filter((item) => ['N', 'NOR', 'APR'].includes(item.value))
        .toSorted((a, b) =>
          compareWithPriority(a.value, b.value, 'ascend', subscriptionStatuspriority),
        ),
    [serviceList, intlObj, message],
  );

  // 🌟 [수정] 서비스 타입 필터 목록 생성 (의존성 배열에서 외부 상수는 제거)
  const svcTypeFilters = useMemo(
    () =>
      generateFiltersFromData(serviceList, 'svcType', {
        API: 'API',
        LLM: 'LLM',
        CTS: 'CTS',
        DRM: 'DRM',
        MCP: 'MCP',
      })
        .filter((item) => ['API', 'LLM', 'CTS', 'DRM', 'MCP'].includes(item.value))
        .toSorted((a, b) =>
          compareWithPriority(a.value, b.value, 'ascend', svcTypeStatuspriority),
        ),
    [serviceList],
  );

  // 서비스 목록 조회 디스패치
  const getServiceList = ({ keyword, sortBy, category, keyId, svcType }) => {
    dispatch(
      fetchServiceList({
        keyword,
        sortBy,
        category,
        keyId,
        svcType,
      }),
    );
  };

  // 서비스 목록 조회 useEffect
  useEffect(() => {
    if (!fetchSelectedKeyIdLoading) {
      setPage(1);
      getServiceList({
        keyword: searchedTerm,
        sortBy,
        category: selectedCategories.join(','),
        keyId: selectedKey?.keyId,
        svcType,
      });
      if (expandedIds[0] !== undefined) {
        handleFetchApiListByService(expandedIds[0]);
      }
    }
  }, [
    svcType,
    fetchSelectedKeyIdLoading,
    searchedTerm,
    sortBy,
    selectedCategories,
    selectedKey,
  ]);

  useEffect(() => {
    if (!pendingDrmSubscribeVerify) return;
    if (verifyLoading) return;
    if (!verifySuccess) return;

    if (result === 'VALID') {
      dispatch(resetDrmEmpNoResult());
      setPendingDrmSubscribeVerify(false);

      const { svcId, keyId, checkedApiList, autoAppr } = pendingDrmSubscribe;

      if (!svcId || !keyId || checkedApiList.length === 0) {
        addToast(intlObj.get(message['store.validation.notSelectSubApi']), 'warning');
        setPendingDrmSubscribe(defaultPendingDrmSubscribe);
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
          requestSubscribe(svcId, keyId, checkedApiList, autoAppr, loginSysEmpNo);
        },
        hideCancel: false,
      });
      return;
    }

    if (verifyMessage) {
      addToast(verifyMessage, 'warning');
    }

    dispatch(resetDrmEmpNoResult());
    setPendingDrmSubscribeVerify(false);
    setPendingDrmSubscribe(defaultPendingDrmSubscribe);
  }, [
    pendingDrmSubscribeVerify,
    verifyLoading,
    verifySuccess,
    result,
    verifyMessage,
    pendingDrmSubscribe,
    selectedKey,
    dispatch,
    addToast,
    loginSysEmpNo,
  ]);

  const handleUpdateListState = (field, updatedData) => {
    dispatch(updateListField({ field: `${field}`, value: updatedData }));
  };

  const handleUpdateKeyState = (field, updatedData) => {
    dispatch(updateKeyField({ field: `${field}`, value: updatedData }));
  };

  const handleNavigateToMyKeys = () => {
    navigate(`${getRoutePath(basename, '/my/keys')}`);
  };

  const handleNavigateToDetail = (id) => {
    if (id) {
      navigate(`${getRoutePath(basename, '/api/detail/' + id)}`);
    }
  };

  const handleSaveKey = (updatedData) => {
    localStorage.setItem('apiStoreKey', updatedData?.keyId);
    handleUpdateKeyState('selectedKeyId', updatedData?.keyId);
    setOpenKeyPopup(false);
  };

  const handleToggleViewType = (type) => {
    setViewType(type);
    setExpandedIds([]);
    setPageSize(type === 'list' ? 10 : 9);
    setPage(1);
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const escapedSearchTerm = escapeRegExp(searchTerm);
    const parts = text.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <Highlight key={index}>{part}</Highlight>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  const handleFetchApiListByService = (svcId) => {
    dispatch(fetchApiListByService({ svcId, keyId: selectedKey?.keyId }));
  };

  const handleExpandCollapseTable = async (expand, svcId) => {
    if (expand) {
      handleFetchApiListByService(svcId);
      setExpandedIds([svcId]);
      const serviceDetail = await getServiceAuthCd(svcId);
      const authCd = serviceDetail?.data?.response?.authCd || 'NON';
      if (authCd === 'PRJ') {
        const permission = await getSubscriptionPermission(svcId, selectedKey?.keyId);
        const subAuthCd = permission?.data?.response || 'NON';
        setServiceSubscriptionPermission(subAuthCd);
      } else {
        setServiceSubscriptionPermission('NOR');
      }
    } else {
      setExpandedIds([]);
    }
  };

  const handleCheckApi = (svcId, apiId, checked) => {
    const nextData = produce(apiListByService, (draft) => {
      const apiList = draft?.[svcId];
      if (apiList) {
        const targetApi = apiList?.find((api) => api?.apiId === apiId);
        if (targetApi) {
          targetApi.isChecked = checked;
        }
      }
    });
    handleUpdateListState('apiListByService', nextData);
  };

  const requestSubscribe = useCallback(
    async (svcId, keyId, apiList, autoAppr, verifiedSysEmpNo) => {
      try {
        const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;
        const isDrm = svcType === 'DRM';
        const body = [];

        for (const api of apiList) {
          const { pubId } = api;
          body.push({
            svcId,
            keyId,
            pubId,
            subStatCd: 'APR',
            aprvReason: '구독 신청',
            sysEmpNo: isDrm ? verifiedSysEmpNo || loginSysEmpNo : undefined,
          });
        }

        const response = await axios.put(
          `${process.env.VITE_REACT_APP_API_STORE_URL}/api/myPage/modifySub`,
          body,
        );

        if (response.status === 200) {
          addToast(
            autoAppr === 'Y'
              ? intlObj.get(message['store.success.reqSubAutoAppr']) + ' ' + intlObj.get(message['store.success.editSubReq.noticeDelay'])
              : intlObj.get(message['store.success.reqSub']),
            'success',
          );
          getServiceList({
            keyword: searchedTerm,
            sortBy,
            category: selectedCategories.join(','),
            keyId: selectedKey?.keyId,
            svcType,
          });
          if (expandedIds[0] !== undefined) {
            handleFetchApiListByService(expandedIds[0]);
          }
        } else if (response?.response?.status === 400) {
          const serverMessage = response?.response?.data?.message;
          let warningMsg = intlObj.get(message['store.warning.alreadySub']);
          addToast(getInvalidSysEmpNoWarningMsg(serverMessage, warningMsg), 'warning');
        } else {
          addToast(intlObj.get(message['store.error.reqSub']), 'error');
        }
      } catch (error) {
        addToast(intlObj.get(message['store.error.reqSub']), 'error');
        console.error('Error:', error);
      }
    },
    [searchedTerm, sortBy, selectedCategories, selectedKey, expandedIds, intlObj, message, loginSysEmpNo, serviceList, svcType],
  );

  const handleClickSubscribe = useCallback(
    (svcId, apiList, autoAppr) => {
      const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;
      const isDrm = svcType === 'DRM';
      if (isDrm && !isLoginSysEmpNo) {
        addToast(intlObj.get(message['store.warning.subscriptionPrerequisite']), 'warning');
        return;
      }

      const checkedApiList = apiList.filter((api) => api.isChecked === true && api.subStat !== 'NOR');
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
            draft.desc = intlObj.get(message['store.warning.isPendingReqPermission']);
          }),
        );
      } else if (checkedApiList.length > 0) {
        if (isDrm) {
          if (verifyLoading) return;

          setPendingDrmSubscribe({
            svcId,
            keyId: selectedKey?.keyId,
            checkedApiList,
            autoAppr,
          });
          setPendingDrmSubscribeVerify(true);
          dispatch(verifyDrmEmpNo({ keyId: selectedKey?.keyId }));
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
              requestSubscribe(svcId, selectedKey?.keyId, checkedApiList, autoAppr, undefined);
            };
            draft.hideCancel = false;
          }),
        );
      } else {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(message['store.validation.notSelectSubApi']);
          }),
        );
      }
    },
    [serviceSubscriptionPermission, subscribeConfirm, selectedKey, requestSubscribe, intlObj, message, serviceList, isLoginSysEmpNo, verifyLoading, dispatch],
  );

  // card type 데이터 가공
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
              {value?.svcType && value?.svcType !== 'API' ? `[${value?.svcType}] ` : ''}
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
              onClickSubscribe={() => handleClickSubscribe(svcId, apiListOfService, autoAppr)}
              hasPendingApproval={hasPendingApproval}
              hasKey={hasKey}
              hasSubscribed={hasSubscribed}
              onCheckApi={(name, checked) => handleCheckApi(svcId, name, checked)}
            />
          );
        });
      }),
    [categoryLanguage, serviceList, apiListByService, fetchApiListByServiceLoading, searchTerm, expandedIds, selectedKey, handleClickSubscribe, intlObj, message],
  );

  // 🌟 list type 컬럼 정의
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
            {highlightText(text, searchTerm)}
            {record?.svcType && record?.svcType === 'LLM' && record?.svcModel && (
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
        render: (text) => <Ellipsis line={2}>{highlightText(text, searchTerm)}</Ellipsis>,
        onCell: (record) => ({
          onClick: (e) => {
            handleNavigateToDetail(record?.svcId);
            e.stopPropagation();
          },
        }),
      },
      {
        title: intlObj.get(message['store.svcType']),
        dataIndex: 'svcType',
        key: 'svcType',
        width: '6%',
        resize: true,
        ellipsis: true,
        align: 'center',
        showSorterTooltip: false,
        filters: svcTypeFilters,
        // 🌟 [수정] 실제 필터링 동작을 수행하는 함수 바인딩 추가
        onFilter: (value, record) => onFilter(value, record?.svcType),
        sorter: (a, b, order) => compareString(a?.svcType, b?.svcType, order),
        render: (text, record) => <>{record?.svcType}</>,
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
        width: '7%',
        resize: true,
        ellipsis: true,
        align: 'center',
        showSorterTooltip: false,
        sorter: (a, b, order) => compareString(categoryLanguage?.[a?.catId], categoryLanguage?.[b?.catId], order),
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
        render: (text) => (text ? dayjs(text).format('YYYY.MM.DD') : '-'),
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
        sorter: (a, b, order) => compareWithPriority(a?.subStatCd, b?.subStatCd, order, subscriptionStatuspriority),
        filters: statusFilters,
        align: 'center',
        onFilter: (value, record) => onFilter(value, record?.subStatCd),
        render: (text, record) => {
          const svcId = record?.svcId;
          const isExpanded = !expandedIds.includes(svcId);
          let button;
          if (record.subStatCd === 'APR') {
            button = (
              <Buttons.ColorFilled type={'orange'} size={'small'} onClick={() => handleExpandCollapseTable(isExpanded, svcId)}>
                {intlObj.get(message['store.pendingApr'])}
              </Buttons.ColorFilled>
            );
          } else if (record.subStatCd === 'NOR') {
            button = (
              <Buttons.ColorFilled type={'green'} size={'small'} onClick={() => handleExpandCollapseTable(isExpanded, svcId)}>
                {intlObj.get(message['store.subscribing'])}
              </Buttons.ColorFilled>
            );
          } else {
            button = (
              <Buttons.ColorFilled type={'primary'} size={'small'} onClick={() => handleExpandCollapseTable(isExpanded, svcId)}>
                {intlObj.get(message['store.subReq'])}
              </Buttons.ColorFilled>
            );
          }
          return button;
        },
        onCell: () => ({ onClick: (e) => e.stopPropagation() }),
      },
    ],
    [searchTerm, categoryLanguage, expandedIds, statusFilters, svcTypeFilters, intlObj, message],
  );

  // list type 데이터 가공
  const listTableData = useMemo(
    () =>
      produce(serviceList, (draft) => {
        draft.map((value, index) => {
          const svcId = value?.svcId;
          const autoAppr = value?.autoAppr;
          const hasPendingApproval = value.subStatCd === 'APR';
          const hasSubscribed = value.subStatCd === 'NOR';
          const hasKey = selectedKey !== undefined;
          const apiListOfService = apiListByService?.[svcId] || [];
          value.expandedArea = (
            <ExpandedTable
              loading={fetchApiListByServiceLoading}
              key={svcId}
              data={apiListOfService}
              hasPendingApproval={hasPendingApproval}
              hasKey={hasKey}
              hasSubscribed={hasSubscribed}
              onClickSubscribe={() => handleClickSubscribe(svcId, apiListOfService, autoAppr)}
              onCheckApi={(name, checked) => handleCheckApi(svcId, name, checked)}
              type={'borderless'}
            />
          );
        });
      }),
    [serviceList, apiListByService, fetchApiListByServiceLoading, selectedKey, handleClickSubscribe],
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
            <ViewToggler viewType={viewType} onClick={(type) => handleToggleViewType(type)} />
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
            <Select options={pageSizeOptions.card} value={pageSize} onSelect={(value) => setPageSize(value)} />
          }
          emptyText={<NoData title={'No Data'} desc={intlObj.get(message['store.noData'])} height={300} />}
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
            <Select options={pageSizeOptions.list} value={pageSize} onSelect={(value) => setPageSize(value)} />
          }
          onExpand={(expand, record) => handleExpandCollapseTable(expand, record?.svcId)}
          scroll={{ y: 500 }}
        />
      )}
      <KeyModal open={openKeyPopup} onOk={(updatedData) => handleSaveKey(updatedData)} onCancel={() => setOpenKeyPopup(false)} value={selectedKey} />
      <CategoryModal open={openCategoryPopup} treeData={categoryTree} selectedData={selectedCategories} onOk={(selectedKeys) => { setSelectedCategories(selectedKeys); setOpenCategoryPopup(false); }} onCancel={() => setOpenCategoryPopup(false)} type={'radio'} />
      <Confirm open={subscribeConfirm.open} title={subscribeConfirm.title} desc={subscribeConfirm.desc} onOk={() => { subscribeConfirm.onConfirm(); setSubscribeConfirm(defaultSubscribeConfirm); }} onCancel={() => setSubscribeConfirm(defaultSubscribeConfirm)} okText={intlObj.get(message['store.ok'])} cancelText={intlObj.get(message['store.cancel'])} hideCancel={subscribeConfirm.hideCancel} />
    </>
  );
};

export default Total;
