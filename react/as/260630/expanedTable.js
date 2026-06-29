//ExpandedTable.jsx
const ExpandedTable = ({
  data = [],
  hasPendingApproval = false,
  hasKey = true,
  hasSubscribed = false,
  onClickSubscribe = () => {},
  onCheckApi = () => {},
  type,
  loading,
  subStatCd,
}) => {

// Total.jsx -getServiceList 아래쯤에 추
  const refreshServiceList = useCallback(() => {
  getServiceList({
    keyword: searchedTerm,
    sortBy,
    category: selectedCategories.join(','),
    keyId: selectedKey?.keyId,
    selectedSvcType,
    selectedSubscribeType,
  });
}, [
  searchedTerm,
  sortBy,
  selectedCategories,
  selectedKey,
  selectedSvcType,
  selectedSubscribeType,
]);

const handleExpandCollapseTable = useCallback(
  (shouldExpand, svcId, subStatCd) => {
    if (!svcId) return;

    if (!shouldExpand) {
      setExpandedIds([]);
      return;
    }

    if (subStatCd?.startsWith('SUB')) {
      handleFetchApiListByService(svcId);
    }

    setExpandedIds([svcId]);
    setServiceSubscriptionPermission(subStatCd);
  },
  [handleFetchApiListByService],
);

const handleFetchApiListByService = useCallback(
  (svcId) => {
    if (!svcId || !selectedKey?.keyId) return;

    dispatch(fetchApiListByService({ svcId, keyId: selectedKey.keyId }));
  },
  [dispatch, selectedKey],
);


  //권한신청 함수 async로 교체
const handleRequestSubscriptionPermission = useCallback(
  async (svcId) => {
    if (!svcId || !selectedKey?.keyId) return;

    try {
      setExpandedIds([svcId]);
      setServiceSubscriptionPermission(subStatusMap.AUTH_APR);

      const response = await axios.post(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/api/serReq`,
        {
          svcId,
          keyId: selectedKey.keyId,
        },
      );

      if (response.status === 200) {
        addToast(
          intlObj.get(message['store.success.reqSubPermission']),
          'success',
        );

        refreshServiceList();

        setExpandedIds([svcId]);
        setServiceSubscriptionPermission(subStatusMap.AUTH_APR);
        return;
      }

      addToast(intlObj.get(message['store.error.reqSubPermission']), 'error');
    } catch (error) {
      const status = error?.response?.status;

      if (status === 400) {
        addToast(
          intlObj.get(message['store.warning.alreadyReqSubPermission']),
          'warning',
        );

        refreshServiceList();
        setExpandedIds([svcId]);
        setServiceSubscriptionPermission(subStatusMap.AUTH_APR);
        return;
      }

      addToast(intlObj.get(message['store.error.reqSubPermission']), 'error');
      console.error('권한 요청 실패:', error);
    }
  },
  [selectedKey, addToast, intlObj, message, refreshServiceList],
);


// requestSubscribe
if (response.status === 200) {
  addToast(
    autoAppr === 'Y'
      ? intlObj.get(message['store.success.reqSubAutoAppr']) +
          ' ' +
          intlObj.get(message['store.success.editSubReq.noticeDelay'])
      : intlObj.get(message['store.success.reqSub']),
    'success',
  );

  refreshServiceList();

  setExpandedIds([svcId]);

  if (autoAppr === 'Y') {
    setServiceSubscriptionPermission(subStatusMap.SUB_NOR);
  } else {
    setServiceSubscriptionPermission(subStatusMap.SUB_APR);
  }

  handleFetchApiListByService(svcId);
}


// onExpand 버그
  onExpand={(expand, record) =>
  handleExpandCollapseTable(expand, record?.svcId, record?.subStatCd)
}

//isExpanded이름 
const shouldExpand = !expandedIds.includes(svcId);
handleExpandCollapseTable(shouldExpand, svcId, subStatCd);

//list type ExpndedTable
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
  onCheckApi={(apiId, checked) =>
    handleCheckApi(svcId, apiId, checked)
  }
  type={'borderless'}
  subStatCd={value.subStatCd}
/>

//map은 새 배열 만들 때 쓰는 거라 여기서는 forEach가 맞아.
produce(serviceList, (draft) => {
  draft.forEach((value, index) => {
    ...
  });
});
