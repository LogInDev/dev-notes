const navigateToDetail = (id, keyId, keyName) => {
  if (!id) return;

  const detailInfo = { keyId, keyName };
  localStorage.setItem('apiInfo', JSON.stringify(detailInfo));

  navigate(`${getRoutePath(basename, '/dashboard/detail/' + id)}`, {
    state: {
      mode: 'REG',
      apiInfo: detailInfo,
    },
  });
};

const navigateToDetail = (id, keyId, keyName) => {
  if (!id) return;

  const detailInfo = { keyId, keyName };
  localStorage.setItem('apiInfo', JSON.stringify(detailInfo));

  navigate(`${getRoutePath(basename, '/dashboard/detail/' + id)}`, {
    state: {
      mode: 'SUB',
      apiInfo: detailInfo,
    },
  });
};


const location = useLocation();
const routeMode = location?.state?.mode ?? null;


const baseItems = [
  {
    key: 'api',
    label: intlObj.get(message['store.apiMonitoring']),
    children: <ApiMonitoring mode={routeMode} />,
  },
];

const buildInitialApiInfo = (propMode) => {
  const storageApiInfo = getSafeParsedApiInfo();
  const storageKeyId = storageApiInfo?.keyId ?? null;
  const storageKeyName = storageApiInfo?.keyName ?? '';

  if (propMode === API_MONITORING_MODE.REG) {
    return {
      mode: API_MONITORING_MODE.REG,
      selectedKeyId: null,
      selectedKeyName: '',
    };
  }

  if (propMode === API_MONITORING_MODE.SUB) {
    return {
      mode: API_MONITORING_MODE.SUB,
      selectedKeyId: storageKeyId && storageKeyId !== 'REG' ? storageKeyId : null,
      selectedKeyName: storageKeyId && storageKeyId !== 'REG' ? storageKeyName : '',
    };
  }

  // fallback
  if (storageKeyId === 'REG') {
    return {
      mode: API_MONITORING_MODE.REG,
      selectedKeyId: null,
      selectedKeyName: '',
    };
  }

  return {
    mode: API_MONITORING_MODE.SUB,
    selectedKeyId: storageKeyId,
    selectedKeyName: storageKeyName,
  };
};


useEffect(() => {
  const initialApiInfo = buildInitialApiInfo(propMode);
  setApiInfo(initialApiInfo);
}, [propMode]);

useEffect(() => {
  if (!svcId) return;
  dispatch(fetchServiceDetail({ svcId }));
}, [dispatch, svcId]);



