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
  for (let node of tree) {
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
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// 구독 권한 조회
const getSubscriptionPermission = async (svcId, keyId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/serReq`,
    { params: { svcId, keyId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// 구독 현황에 대한 정렬 및 필터 박스 노출 우선순위
const subscriptionStatuspriority = { N: 1, NOR: 2, APR: 3 };

const VERIFY_STATUS = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  INVALID_KEY_TYPE: 'INVALID_KEY_TYPE',
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
  const fetchSelectedKeyIdLoading = selectedKeyId === null; // selectedKeyId 가 null 인 경우 keyList 로딩 후 selectedKeyId 설정 중인 상태
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
  const [viewType, setViewType] = useState('card'); // list or card
  const [expandedIds, setExpandedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // list: 10 / card: 9
  const [serviceSubscriptionPermission, setServiceSubscriptionPermission] =
    useState('NON'); // 구독 권한 (권한 없음: NON or 권한 대기: APR or 정상: NOR)
  const [subscribeConfirm, setSubscribeConfirm] = useState(
    defaultSubscribeConfirm,
  );

  const [drmVerifiedEmpNo, setDrmVerifiedEmpNo] = useState(null);
  const [pendingDrmSubscribeVerify, setPendingDrmSubscribeVerify] =
    useState(false);

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

  // 선택된 카테고리의 name 값
  const selectedCategoryName = useMemo(
    () =>
      selectedCategories[0]
        ? categoryLanguage?.[
            findNodeByKey(categoryTree, selectedCategories[0])?.catId
          ] || ''
        : '',
    [categoryTree, selectedCategories, categoryLanguage],
  );

  // 정렬 옵션
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
          compareWithPriority(
            a.value,
            b.value,
            'ascend',
            subscriptionStatuspriority,
          ),
        ),
    [serviceList, subscriptionStatuspriority, intlObj, message],
  );

  // 서비스 목록 조회
  const getServiceList = ({ keyword, sortBy, category, keyId }) => {
    dispatch(
      fetchServiceList({
        keyword,
        sortBy,
        category,
        keyId,
      }),
    );
  };

  // 서비스 목록 조회
  useEffect(() => {
    // 아직 selectedKeyId 가 확정되지 않았으므로 fetch 대기
    if (!fetchSelectedKeyIdLoading) {
      setPage(1);
      getServiceList({
        keyword: searchedTerm,
        sortBy,
        category: selectedCategories.join(','),
        keyId: selectedKey?.keyId,
      });
      if (expandedIds[0] !== undefined) {
        // 구독한 서비스의 API 목록 재 조회
        handleFetchApiListByService(expandedIds[0]);
      }
    }
  }, [
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

    if (result === VERIFY_STATUS.VALID) {
      setDrmVerifiedEmpNo(loginSysEmpNo);
      setPendingDrmSubscribeVerify(false);
      dispatch(resetDrmEmpNoResult());

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
      return;
    }

    if (verifyMessage) {
      addToast(verifyMessage, 'warning');
    }

    setPendingDrmSubscribeVerify(false);
    dispatch(resetDrmEmpNoResult());
  }, [
    pendingDrmSubscribeVerify,
    verifyLoading,
    verifySuccess,
    result,
    verifyMessage,
    loginSysEmpNo,
    dispatch,
    addToast,
  ]);

  // Redux State Update
  const handleUpdateListState = (field, updatedData) => {
    dispatch(updateListField({ field: `${field}`, value: updatedData }));
  };

  // Redux State Update
  const handleUpdateKeyState = (field, updatedData) => {
    dispatch(updateKeyField({ field: `${field}`, value: updatedData }));
  };

  // 키 관리 화면으로 페이지 전환 핸들링
  const handleNavigateToMyKeys = () => {
    navigate(`${getRoutePath(basename, '/my/keys')}`);
  };

  // 상세 화면으로 페이지 전환 핸들링
  const handleNavigateToDetail = (id) => {
    if (id) {
      navigate(`${getRoutePath(basename, '/api/detail/' + id)}`);
    }
  };

  // 키 모달 선택 완료 시 핸들링
  const handleSaveKey = (updatedData) => {
    localStorage.setItem('apiStoreKey', updatedData?.keyId);
    handleUpdateKeyState('selectedKeyId', updatedData?.keyId);
    setOpenKeyPopup(false);
  };

  // 뷰타입 변경 시 핸들링
  const handleToggleViewType = (type) => {
    setViewType(type);
    setExpandedIds([]);
    setPageSize(type === 'list' ? 10 : 9);
    setPage(1);
  };

  // 검색어 하이라이팅
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

  // 서비스별 API 목록 조회 시 핸들링
  const handleFetchApiListByService = (svcId) => {
    dispatch(fetchApiListByService({ svcId, keyId: selectedKey?.keyId }));
  };

  // CollapseTable expand 시 핸들링
  const handleExpandCollapseTable = async (expand, svcId) => {
    const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;

    // DRM 서비스의 경우 시스템 사번 등록을 위해 Detail 화면에서 '구독 신청' 가능
    // if (svcType === 'DRM') {
    //   handleNavigateToDetail(svcId);
    //   return;
    // }

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

  // API 구독 체크 시 핸들링
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

  // 구독 요청
  const requestSubscribe = useCallback(
    async (svcId, keyId, apiList, autoAppr) => {
      try {
        const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;
        const isDrm = !!svcType === 'DRM';
        const body = [];

        for (const api of apiList) {
          const { pubId } = api;
          body.push({
            svcId,
            keyId,
            pubId,
            subStatCd: 'APR',
            aprvReason: '구독 신청',
            sysEmpNo: isDrm ? drmVerifiedEmpNo || loginSysEmpNo : undefined,
          });
        }

        const response = await axios.put(
          `${process.env.VITE_REACT_APP_API_STORE_URL}/api/myPage/modifySub`,
          body,
        );

        if (response.status === 200) {
          addToast(
            autoAppr === 'Y'
              ? intlObj.get(message['store.success.reqSubAutoAppr']) +
                  ' ' +
                  intlObj.get(message['store.success.editSubReq.noticeDelay'])
              : intlObj.get(message['store.success.reqSub']),
            'success',
          );
          // 전체 서비스 목록 재 조회
          getServiceList({
            keyword: searchedTerm,
            sortBy,
            category: selectedCategories.join(','),
            keyId: selectedKey?.keyId,
          });
          if (expandedIds[0] !== undefined) {
            // 구독한 서비스의 API 목록 재 조회
            handleFetchApiListByService(expandedIds[0]);
          }
        } else if (response?.response?.status === 400) {
          addToast(intlObj.get(message['store.warning.alreadySub']), 'warning');
        } else {
          addToast(intlObj.get(message['store.error.reqSub']), 'error');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    },
    [
      searchedTerm,
      sortBy,
      selectedCategories,
      selectedKey,
      expandedIds,
      intlObj,
      message,
    ],
  );
