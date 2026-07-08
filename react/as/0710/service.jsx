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
const [apiInfo, setApiInfo] = useState(() => buildInitialApiInfo());

const { mode, selectedKeyId, selectedKeyName } = apiInfo;

const isMngMode = useMemo(
  () => mode === API_MONITORING_MODE.MNG,
  [mode],
);

//  제거
// useEffect(() => {
//   setApiInfo(buildInitialApiInfo());
// }, []);
