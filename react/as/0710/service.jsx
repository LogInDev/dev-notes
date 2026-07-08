//myService.jsx
const navigateToDashboardDetail = (id) => {
  if (!id) return;

  localStorage.setItem(
    'apiInfo',
    JSON.stringify({
      keyId: 'MNG',
      keyName: '',
    }),
  );

  navigate(`${getRoutePath(basename, '/dashboard/detail/' + id)}`);
};

onClick={() => navigateToDashboardDetail(record?.svcId)}

//ApiMonitoring.jsx
// 모드 / 키 정보
const [apiInfo, setApiInfo] = useState(() => buildInitialApiInfo());

const { mode, selectedKeyId, selectedKeyName } = apiInfo;

const isMngMode = mode === API_MONITORING_MODE.MNG;

// 키 관련
const [keyList, setKeyList] = useState([]);

const selectedKey = useMemo(
  () =>
    keyList.find(
      (key) => String(key.keyId) === String(selectedKeyId),
    ),
  [keyList, selectedKeyId],
);

const keyOptions = useMemo(
  () => [
    { label: '전체 Key 조회', value: 'allSelect' },
    ...keyList.map((item) => ({
      label: item?.keyName || '-',
      value: item?.keyId,
    })),
  ],
  [keyList],
);

// key select 옵션 미리 조회
useEffect(() => {
  if (!svcId || !mode) return;

  let isMounted = true;

  const fetchKeyList = async () => {
    try {
      const keyApiUrl =
        mode === API_MONITORING_MODE.MNG
          ? `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiAllKeyList`
          : `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiKeyList`;

      const response = await axios.get(keyApiUrl, {
        params: { svcId },
      });

      if (!response.status || response.status < 200 || response.status >= 300) {
        throw response;
      }

      const responseList = Array.isArray(response?.data?.response)
        ? response.data.response
        : [];

      const transformedData = responseList.map((item) => ({
        keyId: item.keyId,
        keyName: item.keyName,
        appNm: item.appNm,
        prjId: item.prjId,
        authCd: item.authCd,
        regUserNm: item.regUserNm,
        regUserId: item.ownerId,
        regDttm: item.regDttm,
        svcId: item.svcId,
      }));

      if (isMounted) {
        setKeyList(transformedData);
      }
    } catch (error) {
      console.error('Error:', error);

      if (isMounted) {
        setKeyList([]);
      }
    }
  };

  fetchKeyList();

  return () => {
    isMounted = false;
    setKeyList([]);
  };
}, [svcId, mode]);


const handleSelectKeyChange = (selectedValue) => {
  if (selectedValue === 'allSelect') {
    setApiInfo((prev) => ({
      ...prev,
      selectedKeyId: null,
      selectedKeyName: '',
    }));
    return;
  }

  const selectedData = keyList.find(
    (key) => String(key.keyId) === String(selectedValue),
  );

  if (!selectedData) return;

  setApiInfo((prev) => ({
    ...prev,
    selectedKeyId: selectedData.keyId,
    selectedKeyName: selectedData.keyName,
  }));
};

{isMngMode ? (
  <span>
    <Select
      placeholder={intlObj.get(message['store.selectKey'])}
      width={240}
      value={selectedKeyId || 'allSelect'}
      options={keyOptions}
      onChange={handleSelectKeyChange}
    />
  </span>
) : (
  <span>
    <Selector
      onClick={handleOpenKeyPopup}
      placeholder={intlObj.get(message['store.selectKey'])}
      icon={'key'}
    >
      {selectedKeyName || []}
    </Selector>
  </span>
)}



