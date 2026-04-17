import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@/utils/ToastProvider';
import {
  fetchApiListByService,
  fetchServiceList,
  updateField as updateListField,
} from '@/store/reduxStore/list/reducer';
import {
  verifyDrmEmpNo,
  resetDrmEmpNoResult,
} from '@/store/reduxStore/detail/reducer';
import { updateField as updateKeyField } from '@/store/reduxStore/keySelect/reducer';
import { BasenameContext } from '@/utils/Context';
import { getRoutePath } from '@/utils/Str';
import {
  compareNumber,
  compareString,
  compareWithPriority,
  generateFiltersFromData,
  onFilter,
} from '@/utils/tableUtils';
import { processCategoryForTree } from '@/utils/categoryUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import { produce } from 'immer';
import axios from 'axios';
import Buttons from '@/components/Atoms/Buttons';
import Select from '@/components/Atoms/Select';
import Ellipsis from '@/components/Atoms/Ellipsis';
import CollapseTable from '@/components/Organisms/CollapseTable';
import CategoryModal from '@/components/Organisms/CategoryModal';
import CardTable from '@/components/Organisms/CardTable';
import Confirm from '@/components/Atoms/Confirm';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Dropdown from '@/components/Atoms/Dropdown';
import KeyModal from '@/components/Templates/KeyModal';
import NoData from '@/components/Atoms/NoData';
import ModelName from '@/components/Atoms/ModelName';
import Division from '@/components/Atoms/Division';
import Highlight from '@/components/Atoms/Highlight';
import Selector from '@/components/Organisms/Selector';
import ApplyKey from '@/components/Atoms/ApplyKey';
import ViewToggler from '@/components/Organisms/ViewToggler';
import ExpandedTable from './expandedTable';

// tree 에서 key 에 해당하는 node 찾기
const findNodeByKey = (tree, key) => {
  for (const node of tree) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const result = findNodeByKey(node.children, key);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

// 이스케이프 함수(모든 특수 문자 이스케이프)
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 서비스 권한 프로젝트 or 제한없음 체크를 위한 서비스 상세 정보 조회
const getServiceAuthCd = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/svc/authCd`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300) {
    throw new Error(response);
  }
  return response;
};

// 구독 권한 조회
const getSubscriptionPermission = async (svcId, keyId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/serReq`,
    { params: { svcId, keyId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300) {
    throw new Error(response);
  }
  return response;
};

// 구독 현황에 대한 정렬 및 필터 박스 노출 우선순위
const subscriptionStatuspriority = { N: 1, NOR: 2, APR: 3 };

const VERIFY_STATUS = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  INVALID_KEY_TYPE: 'INVALID_KEY_TYPE',
};

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

  const { addToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  const listState = useSelector((state) => state.get('list')) || {};
  const serviceList = listState?.serviceList || [];
  const fetchServiceListLoading = listState?.fetchServiceListLoading || false;
  const apiListByService = listState?.apiListByService || {};
  const fetchApiListByServiceLoading =
    listState?.fetchApiListByServiceLoading || false;

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
  const [serviceSubscriptionPermission, setServiceSubscriptionPermission] =
    useState('NON');
  const [subscribeConfirm, setSubscribeConfirm] = useState(
    defaultSubscribeConfirm,
  );

  // [CHANGED] DRM verify 전에 필요한 파라미터를 안전하게 보관
  const [pendingDrmSubscribeVerify, setPendingDrmSubscribeVerify] =
    useState(false);
  const [pendingDrmSubscribe, setPendingDrmSubscribe] = useState(
    defaultPendingDrmSubscribe,
  );

  const verifyMessage = useMemo(() => {
    if (result === VERIFY_STATUS.INVALID) {
      return intlObj.get(message['store.validation.invalidSysEmpNo']);
    }
    if (result === VERIFY_STATUS.INVALID_KEY_TYPE) {
      return intlObj.get(message['store.validation.selectKeyType']);
    }
    if (error?.message) {
      return error.message;
    }
    return null;
  }, [result, error]);

  const selectedCategoryName = useMemo(
    () =>
      selectedCategories[0]
        ? categoryLanguage?.[
            findNodeByKey(categoryTree, selectedCategories[0])?.catId
          ] || ''
        : '',
    [categoryTree, selectedCategories, categoryLanguage],
  );

  const sortOptions = [
    {
      key: 'upd_dttm',
      label: intlObj.get(message['store.order.recent']),
      onClick: (item) => {
        setSortBy(item.key);
      },
    },
    {
      key: 'sub_count',
      label: intlObj.get(message['store.order.subCount']),
      onClick: (item) => {
        setSortBy(item.key);
      },
    },
    {
      key: 'vw_cnt',
      label: intlObj.get(message['store.order.viewCount']),
      onClick: (item) => {
        setSortBy(item.key);
      },
    },
  ];

  const statusFilters = useMemo(
    () =>
      generateFiltersFromData(serviceList, 'subStatCd', {
        N: intlObj.get(message['store.subReq']),
        NOR: intlObj.get(message['store.subscribing']),
        APR: intlObj.get(message['store.pendingApr']),
      })
        .filter((item) => ['N', 'NOR', 'APR'].includes(item.value))
        .toSorted((a, b) =>
          compareWithPriority(
            a.value,
            b.value,
            'ascend',
            subscriptionStatuspriority,
          ),
        ),
    [serviceList],
  );

  const getServiceList = useCallback(
    ({ keyword, sortBy, category, keyId }) => {
      dispatch(
        fetchServiceList({
          keyword,
          sortBy,
          category,
          keyId,
        }),
      );
    },
    [dispatch],
  );

  const handleFetchApiListByService = useCallback(
    (svcId) => {
      dispatch(fetchApiListByService({ svcId, keyId: selectedKey?.keyId }));
    },
    [dispatch, selectedKey],
  );

  useEffect(() => {
    if (!fetchSelectedKeyIdLoading) {
      setPage(1);
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
  }, [
    fetchSelectedKeyIdLoading,
    searchedTerm,
    sortBy,
    selectedCategories,
    selectedKey,
    expandedIds,
    getServiceList,
    handleFetchApiListByService,
  ]);

  // [CHANGED] verify 결과 처리
  useEffect(() => {
    if (!pendingDrmSubscribeVerify) return;
    if (verifyLoading) return;
    if (!verifySuccess) return;

    if (result === VERIFY_STATUS.VALID) {
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
          requestSubscribe(
            svcId,
            keyId,
            checkedApiList,
            autoAppr,
            loginSysEmpNo,
          );
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

  const handleExpandCollapseTable = async (expand, svcId) => {
    if (expand) {
      handleFetchApiListByService(svcId);
      setExpandedIds([svcId]);

      const serviceDetail = await getServiceAuthCd(svcId);
      const authCd = serviceDetail?.data?.response?.authCd || 'NON';

      if (authCd === 'PRJ') {
        const permission = await getSubscriptionPermission(
          svcId,
          selectedKey?.keyId,
        );
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

  // [CHANGED] verifiedSysEmpNo를 인자로 받도록 변경
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
        } else if (response?.response?.status === 400) {
          addToast(intlObj.get(message['store.warning.alreadySub']), 'warning');
        } else {
          addToast(intlObj.get(message['store.error.reqSub']), 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        addToast(intlObj.get(message['store.error.reqSub']), 'error');
      } finally {
        setPendingDrmSubscribe(defaultPendingDrmSubscribe);
      }
    },
    [
      serviceList,
      loginSysEmpNo,
      addToast,
      intlObj,
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

        // [CHANGED] verify 전에 필요한 값 저장
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
            sysEmpNo: loginSysEmpNo,
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
      serviceSubscriptionPermission,
      serviceList,
      isLoginSysEmpNo,
      verifyLoading,
      dispatch,
      selectedKey,
      loginSysEmpNo,
      intlObj,
      addToast,
      requestSubscribe,
    ],
  );

  const cardTableData = useMemo(
    () =>
      produce(serviceList, (draft) => {
        draft.forEach((value, index) => {
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
    ],
  );

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
          }
          return '-';
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
        sorter: (a, b, order) =>
          compareWithPriority(
            a?.subStatCd,
            b?.subStatCd,
            order,
            subscriptionStatuspriority,
          ),
        filters: statusFilters,
        align: 'center',
        onFilter: (value, record) => onFilter(value, record?.subStatCd),
        render: (text, record) => {
          const svcId = record?.svcId;
          const isExpanded = !expandedIds.includes(svcId);

          if (record.subStatCd === 'APR') {
            return (
              <Buttons.ColorFilled
                type={'orange'}
                size={'small'}
                onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
              >
                {intlObj.get(message['store.pendingApr'])}
              </Buttons.ColorFilled>
            );
          }

          if (record.subStatCd === 'NOR') {
            return (
              <Buttons.ColorFilled
                type={'green'}
                size={'small'}
                onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
              >
                {intlObj.get(message['store.subscribing'])}
              </Buttons.ColorFilled>
            );
          }

          return (
            <Buttons.ColorFilled
              type={'primary'}
              size={'small'}
              onClick={() => handleExpandCollapseTable(isExpanded, svcId)}
            >
              {intlObj.get(message['store.subReq'])}
            </Buttons.ColorFilled>
          );
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
    ],
  );

  const listTableData = useMemo(
    () =>
      produce(serviceList, (draft) => {
        draft.forEach((value) => {
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
              onClickSubscribe={() =>
                handleClickSubscribe(svcId, apiListOfService, autoAppr)
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
          setPendingDrmSubscribe(defaultPendingDrmSubscribe);
        }}
        okText={intlObj.get(message['store.ok'])}
        cancelText={intlObj.get(message['store.cancel'])}
        hideCancel={subscribeConfirm.hideCancel}
      />
    </>
  );
};

export default Total;