// ApiList.jsx
import useRestorableListState from '@/hooks/useRestorableListState';
import { LIST_STATE_KEYS } from '@/constants/listStateKeys';

const DEFAULT_SERVICE_CATALOG_FILTERS = {
  page: 1,
  pageSize: 9,
  viewType: 'card',
  sort: 'upd_dttm',
  svcType: 'all',
  subStatus: 'all',
  category: [],
  keyword: '',
};

const ApiList = () => {
  const basename = useContext(BasenameContext);
  const navigate = useNavigate();

  const [listFilters, setListFilters] = useRestorableListState(
    LIST_STATE_KEYS.SERVICE_CATALOG,
    DEFAULT_SERVICE_CATALOG_FILTERS,
  );

  const [searchTerm, setSearchTerm] = useState(listFilters.keyword || '');
  const [searchedTerm, setSearchedTerm] = useState(listFilters.keyword || '');
  const [selectedCategories, setSelectedCategories] = useState(
    listFilters.category || [],
  );
  const [sortBy, setSortBy] = useState(listFilters.sort || 'upd_dttm');
  ...
};

// 검색/검색취소 page:1처리
const handleSearch = () => {
  setSearchedTerm(searchTerm);

  setListFilters((prev) => ({
    ...prev,
    keyword: searchTerm,
    page: 1,
  }));
};

const handleCancelSearch = () => {
  setSearchTerm('');
  setSearchedTerm('');

  setListFilters((prev) => ({
    ...prev,
    keyword: '',
    page: 1,
  }));
};

//Total.jsx
import { markListRestoreTarget } from '@/hooks/useRestorableListState';
import { LIST_STATE_KEYS } from '@/constants/listStateKeys';

const [viewType, setViewType] = useState(listFilters?.viewType || 'card');
const [expandedIds, setExpandedIds] = useState([]);
const [page, setPage] = useState(listFilters?.page || 1);
const [pageSize, setPageSize] = useState(listFilters?.pageSize || 9);

const [selectedSvcType, setSelectedSvcType] = useState(
  listFilters?.svcType || 'all',
);

const [selectedSubscribeType, setSelectedSubscribeType] = useState(
  listFilters?.subStatus || 'all',
);

//삭제
//const [serviceSubscriptionPermission, setServiceSubscriptionPermission] = useState(subStatusMap.AUTH_NON);
// 관련된 이것들도 전부 삭제 - setServiceSubscriptionPermission(...)
//대신 handleClickSubscribe에 subStatCd를 직접 넘겨


useEffect(() => {
  setPage(listFilters?.page || 1);
}, [listFilters?.page]);

useEffect(() => {
  if (fetchSelectedKeyIdLoading) return;

  getServiceList({
    keyword: searchedTerm,
    sortBy,
    category: selectedCategories.join(','),
    keyId: selectedKey?.keyId,
    selectedSvcType,
    selectedSubscribeType,
  });

  //삭제
  // if (expandedIds[0] !== undefined) {
  //   handleFetchApiListByService(expandedIds[0]);
  // }
}, [
  selectedSvcType,
  selectedSubscribeType,
  fetchSelectedKeyIdLoading,
  searchedTerm,
  sortBy,
  selectedCategories,
  selectedKey?.keyId,
]);

//상세 이동 함수
const handleNavigateToDetail = (id) => {
  if (!id) return;

  navigate(`${getRoutePath(basename, '/api/detail/' + id)}`, {
    state: {
      fromListId: LIST_STATE_KEYS.SERVICE_CATALOG,
      fromListPath: getRoutePath(basename, '/api'),
    },
  });
};


const resetPageAndExpand = useCallback(() => {
  setPage(1);
  setExpandedIds([]);
}, []);
const handleSvcTypeChange = (selectedValue) => {
  setSelectedSvcType(selectedValue);
  resetPageAndExpand();

  setListFilters((prev) => ({
    ...prev,
    svcType: selectedValue,
    page: 1,
  }));
};

const handleSortChange = (selectedValue) => {
  setSortBy(selectedValue);
  resetPageAndExpand();

  setListFilters((prev) => ({
    ...prev,
    sort: selectedValue,
    page: 1,
  }));
};

const handleSubscribeChange = (selectedValue) => {
  setSelectedSubscribeType(selectedValue);
  resetPageAndExpand();

  setListFilters((prev) => ({
    ...prev,
    subStatus: selectedValue,
    page: 1,
  }));
};

const handleCategories = () => {
  setSelectedCategories([]);
  resetPageAndExpand();

  setListFilters((prev) => ({
    ...prev,
    category: [],
    page: 1,
  }));
};

//pageSize 변경
const handlePageSize = (value) => {
  setPageSize(value);
  setPage(1);
  setExpandedIds([]);

  setListFilters((prev) => ({
    ...prev,
    pageSize: value,
    page: 1,
  }));
};

//페이지 변경
const handlePage = (page) => {
  setPage(page);
  setExpandedIds([]);

  setListFilters((prev) => ({
    ...prev,
    page,
  }));
};

// 뷰타입 변경
const handleToggleViewType = (type) => {
  const nextPageSize = type === 'list' ? 10 : 9;

  setViewType(type);
  setPageSize(nextPageSize);
  setPage(1);
  setExpandedIds([]);

  setListFilters((prev) => ({
    ...prev,
    viewType: type,
    pageSize: nextPageSize,
    page: 1,
  }));
};

// 키없음 조건 변수로 빼기
const isInitialLoading = fetchSelectedKeyIdLoading || fetchServiceListLoading;
const hasNoKey = !isInitialLoading && keyList.length === 0;
//렌더 조건 수정
{hasNoKey ? (
  <Division
    flex={true}
    flexFlow={'column'}
    gap={20}
    alignItems={'center'}
  >
    <Divide $border={false} top={20} bottom={0} />
    <NoData height={200} />
    <ContentHeader
      title={<>{intlObj.get(message['store.service.noKeyDesc'])}</>}
    />
  </Division>
) : viewType === 'card' ? (
  <CardTable ... />
) : (
  <CollapseTable ... />
)}

//카테고리 선택 완료 수정
<CategoryModal
  open={openCategoryPopup}
  treeData={categoryTree}
  selectedData={selectedCategories}
  onOk={(selectedKeys) => {
    setSelectedCategories(selectedKeys);
    resetPageAndExpand();

    setListFilters((prev) => ({
      ...prev,
      category: selectedKeys,
      page: 1,
    }));

    setOpenCategoryPopup(false);
  }}
  onCancel={() => {
    setOpenCategoryPopup(false);
  }}
  type={'radio'}
/>
  

//Select는 defaultValue 말고 value
<Select
  width={180}
  placeholder={intlObj.get(message['store.order.recent'])}
  value={sortBy}
  options={sortOptions}
  onChange={handleSortChange}
/>

<Select
  width={180}
  placeholder={intlObj.get(message['store.filter.service'])}
  value={selectedSvcType}
  options={svcTypeOptions}
  onChange={handleSvcTypeChange}
/>

<Select
  width={180}
  placeholder={intlObj.get(message['store.subState'])}
  value={selectedSubscribeType}
  options={subStatusOptions}
  onChange={handleSubscribeChange}
/>

  //서비스 상세에서
    import { useLocation, useNavigate } from 'react-router-dom';
import { LIST_RESTORE_LOCATION_KEY } from '@/constants/listStateKeys';

const Detail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBackToList = () => {
    const fromListId = location.state?.fromListId;
    const fromListPath = location.state?.fromListPath;

    if (fromListId && fromListPath) {
      navigate(fromListPath, {
        state: {
          [LIST_RESTORE_LOCATION_KEY]: fromListId,
        },
      });
      return;
    }

    navigate(-1);
  };

  ...
};


// ------------------------------------------------------------------------------------------------
//src/constants/listStateKeys.js
export const LIST_STATE_KEYS = {
  SERVICE_CATALOG: 'apiStore.list.serviceCatalog',
  MY_SUBSCRIPTION: 'apiStore.list.mySubscription',
  MY_SERVICE_MANAGEMENT: 'apiStore.list.myServiceManagement',
};
export const LIST_RESTORE_LOCATION_KEY = 'restoreListId';

// src/hooks/useRestorableListState.js
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LIST_RESTORE_LOCATION_KEY } from '@/constants/listStateKeys';

const safeParseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const useRestorableListState = (listId, defaultState) => {
  const location = useLocation();
  const navigate = useNavigate();

  const shouldRestoreRef = useRef(
    location.state?.[LIST_RESTORE_LOCATION_KEY] === listId,
  );

  const [state, setState] = useState(() => {
    if (!shouldRestoreRef.current) {
      return defaultState;
    }

    const savedState = safeParseJson(sessionStorage.getItem(listId), null);

    return savedState ? { ...defaultState, ...savedState } : defaultState;
  });

  useEffect(() => {
    sessionStorage.setItem(listId, JSON.stringify(state));
  }, [listId, state]);

  useEffect(() => {
    if (location.state?.[LIST_RESTORE_LOCATION_KEY] === listId) {
      return;
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {
        ...(location.state || {}),
        [LIST_RESTORE_LOCATION_KEY]: listId,
      },
    });
  }, [
    listId,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  return [state, setState, { shouldRestore: shouldRestoreRef.current }];
};

export default useRestorableListState;

// 내구독
const [listFilters, setListFilters] = useRestorableListState(
  LIST_STATE_KEYS.MY_SUBSCRIPTION,
  DEFAULT_MY_SUBSCRIPTION_FILTERS,
);
// 내구독 상세
markListRestoreTarget(LIST_STATE_KEYS.MY_SUBSCRIPTION);

navigate(`${getRoutePath(basename, '/my/subscription/detail/' + id)}`);

//내 서비스 관리
const [listFilters, setListFilters] = useRestorableListState(
  LIST_STATE_KEYS.MY_SERVICE_MANAGEMENT,
  DEFAULT_MY_SERVICE_MANAGEMENT_FILTERS,
);
//상세
markListRestoreTarget(LIST_STATE_KEYS.MY_SERVICE_MANAGEMENT);

navigate(`${getRoutePath(basename, '/my/service/detail/' + id)}`);

// 서비스 카탈로그
useRestorableListState(LIST_STATE_KEYS.SERVICE_CATALOG, DEFAULT_SERVICE_CATALOG_FILTERS)
markListRestoreTarget(LIST_STATE_KEYS.SERVICE_CATALOG)
// 내구독
useRestorableListState(LIST_STATE_KEYS.MY_SUBSCRIPTION, DEFAULT_MY_SUBSCRIPTION_FILTERS)
markListRestoreTarget(LIST_STATE_KEYS.MY_SUBSCRIPTION)
//내서비스관리
useRestorableListState(LIST_STATE_KEYS.MY_SERVICE_MANAGEMENT, DEFAULT_MY_SERVICE_MANAGEMENT_FILTERS)
markListRestoreTarget(LIST_STATE_KEYS.MY_SERVICE_MANAGEMENT)
