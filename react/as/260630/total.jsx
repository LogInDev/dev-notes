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
export const STORAGE_KEY_PREFIX = 'list_state_';

export const PREV_PATH_KEY = 'apiStore.prevPath';
export const CURRENT_PATH_KEY = 'apiStore.currentPath';

/**
 * 목록별 아이디
 */
export const MAIN_LIST_ID = 'main';
export const SUBSCRIBE_LIST_ID = 'subscribe';
export const MANAGE_LIST_ID = 'manage';

/**
 * 목록별 라우트 설정
 * 실제 프로젝트 경로에 맞게 listPath/detailPattern만 관리하면 됨
 */
export const LIST_ROUTE_CONFIG = {
  [MAIN_LIST_ID]: {
    listPath: '/api',
    detailPattern: /\/api\/detail\/[^/]+$/,
  },
  [SUBSCRIBE_LIST_ID]: {
    listPath: '/my/subscription',
    detailPattern: /\/my\/subscription\/detail\/[^/]+$/,
  },
  [MANAGE_LIST_ID]: {
    listPath: '/my/service',
    detailPattern: /\/my\/service\/detail\/[^/]+$/,
  },
};

//useRouterHistory.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CURRENT_PATH_KEY, PREV_PATH_KEY } from '@/constants/listStateKeys';

const useRouteHistory = () => {
  const location = useLocation();

  useEffect(() => {
    const nextPath = `${location.pathname}${location.search || ''}`;
    const currentPath = sessionStorage.getItem(CURRENT_PATH_KEY);

    if (currentPath !== nextPath) {
      sessionStorage.setItem(PREV_PATH_KEY, currentPath || '');
      sessionStorage.setItem(CURRENT_PATH_KEY, nextPath);
    }
  }, [location.pathname, location.search]);
};

export default useRouteHistory;

import useRouteHistory from '@/hooks/useRouteHistory';

const AppLayout = () => {
  useRouteHistory();

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default AppLayout;

import { useState, useEffect } from 'react';
import {
  STORAGE_KEY_PREFIX,
  PREV_PATH_KEY,
  LIST_ROUTE_CONFIG,
  MAIN_LIST_ID,
  SUBSCRIBE_LIST_ID,
  MANAGE_LIST_ID,
} from '@/constants/listStateKeys';

export { MAIN_LIST_ID, SUBSCRIBE_LIST_ID, MANAGE_LIST_ID };

const safeParseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const isRestoreFromOwnDetail = (listId) => {
  const prevPath = sessionStorage.getItem(PREV_PATH_KEY) || '';
  const config = LIST_ROUTE_CONFIG[listId];

  if (!config) {
    return false;
  }

  return config.detailPattern.test(prevPath);
};

const useListState = (listId, initialState) => {
  const storageKey = STORAGE_KEY_PREFIX + listId;

  const [state, setState] = useState(() => {
    const shouldRestore = isRestoreFromOwnDetail(listId);

    if (!shouldRestore) {
      sessionStorage.setItem(storageKey, JSON.stringify(initialState));
      return initialState;
    }

    const saved = safeParseJson(sessionStorage.getItem(storageKey), null);

    return saved ? { ...initialState, ...saved } : initialState;
  });

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey, state]);

  return [state, setState];
};

export default useListState;

  
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

const handleNavigateToDetail = (id) => {
  if (!id) return;

  navigate(`${getRoutePath(basename, '/api/detail/' + id)}`);
};

import useListState, { MAIN_LIST_ID } from '@/hooks/useListState';

const [listFilters, setListFilters] = useListState(
  MAIN_LIST_ID,
  DEFAULT_SERVICE_CATALOG_FILTERS,
);
// 서비스 카탈로그
추가:
1. src/constants/listStateKeys.js
2. src/hooks/useRouteHistory.js
3. 공통 Layout에서 useRouteHistory() 호출

수정:
1. 기존 useListState.js 수정
2. ApiList.jsx는 useListState 그대로 사용
3. Total.jsx 상세 이동 함수는 mark 없이 기존 navigate만 사용

삭제/미사용:
1. useRestorableListState.js
2. markListRestoreTarget
3. navigate(path, { state })
4. isServiceDetailPath
5. NavigationTracker.jsx
