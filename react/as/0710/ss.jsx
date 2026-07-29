import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchApiRankList,
  fetchApiCallList,
  fetchApiErrorList,
  fetchApiResultList,
  fetchApiTot,
  fetchApiRes,
  fetchResponseCode,
} from '@/store/reduxStore/dashboard/reducer';
import dayjs from 'dayjs';
import { upperCase } from 'lodash';
import axios from 'axios';
import { Spin } from 'signlw';
import {
  formatNumberWithComma,
  intlObj,
} from '@/utils/commonUtils';
import { useServicePermission } from '@/hooks/useServicePermission';
import message from '@/language/message';
import Dashboard from '@/components/Organisms/Dashboard';
import Select from '@/components/Atoms/Select';
import CustomSelect from '@/components/Organisms/CustomSelect';
import DatePicker from '@/components/Organisms/DatePicker';
import Confirm from '@/components/Atoms/Confirm';
import Table from '@/components/Organisms/Table';
import Division from '@/components/Atoms/Division';
import LineChart from '../chart/lineChart';
import BarChart from '../chart/barChart';
import ScatterChart from '../chart/scatterChart';

import icon_person from '@/assets/images/dashboard/icon_person.svg';
import icon_cpm_api from '@/assets/images/dashboard/icon_cpm_api.svg';
import icon_time from '@/assets/images/dashboard/icon_time.svg';
import icon_error from '@/assets/images/dashboard/icon_error.svg';

const ALL_KEY_VALUE = 'allSelect';

const defaultTableSorter = {
  sort: null,
  sortField: null,
};

const defaultPageSize = 10;

const getApiInfo = () => {
  try {
    const raw = localStorage.getItem('apiInfo');

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === 'object'
      ? parsed
      : null;
  } catch (error) {
    console.error('apiInfo parse error:', error);
    return null;
  }
};

const buildInitialApiInfo = () => {
  const storageApiInfo = getApiInfo();

  const storageKeyId = storageApiInfo?.keyId;
  const storageKeyName = storageApiInfo?.keyName || '';

  /*
   * 이전 방식에서 저장했을 수 있는 MNG와 allSelect는
   * 실제 Key ID가 아니므로 선택 Key로 사용하지 않는다.
   */
  const hasValidStoredKey =
    storageKeyId !== null &&
    storageKeyId !== undefined &&
    storageKeyId !== '' &&
    storageKeyId !== 'MNG' &&
    storageKeyId !== ALL_KEY_VALUE;

  return {
    selectedKeyId: hasValidStoredKey
      ? storageKeyId
      : null,
    selectedKeyName: hasValidStoredKey
      ? storageKeyName
      : '',
  };
};

/**
 * API 선택값 형식:
 *
 * GET:/api/test
 * POST:https://example.com/api
 *
 * split(':')를 사용하면 URL의 프로토콜 부분까지 분리되므로
 * 첫 번째 콜론만 기준으로 method와 URL을 나눈다.
 */
const parseApiOptionValue = (value) => {
  if (typeof value !== 'string') {
    return {
      method: '',
      apiUrl: '',
    };
  }

  const separatorIndex = value.indexOf(':');

  if (separatorIndex < 0) {
    return {
      method: '',
      apiUrl: value,
    };
  }

  return {
    method: value
      .slice(0, separatorIndex)
      .toLowerCase(),
    apiUrl: value.slice(separatorIndex + 1),
  };
};

const ApiMonitoring = () => {
  const { svcId } = useParams();
  const dispatch = useDispatch();

  const firstOptions = useMemo(
    () => [
      {
        label: intlObj.get(message['store.callCount']),
        value: 'callCnt',
      },
      {
        label: intlObj.get(message['store.errorCount']),
        value: 'errorCnt',
      },
      {
        label: intlObj.get(message['store.responseTime']),
        value: 'respCnt',
      },
    ],
    [],
  );

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

  /*
   * 권한
   */
  const permissionState =
    useSelector((state) => state.get('permission')) || {};

  const isAdmin = permissionState?.isAdmin === 'Y';

  const {
    hasPermission,
    loading: fetchHasPermissionLoading,
  } = useServicePermission(svcId);

  /*
   * 훅이 boolean 또는 Y/N을 반환하는 경우 모두 대응한다.
   */
  const hasServicePermission =
    hasPermission === true ||
    hasPermission === 'Y';

  /*
   * 관리자 또는 서비스 등록자·담당자
   */
  const isMngMode =
    isAdmin || hasServicePermission;

  /*
   * 관리자는 담당자 권한 조회 결과와 무관하게 관리 권한이 있다.
   * 일반 사용자는 담당자 권한 조회가 완료된 후 Key API를 결정한다.
   */
  const isPermissionResolved =
    isAdmin ||
    fetchHasPermissionLoading === false;

  /*
   * Redux Dashboard 상태
   */
  const apiCallState =
    useSelector((state) => state.get('dashboard')) || {};

  const chartState = apiCallState?.chart || {};
  const tableState = apiCallState?.table || {};

  /*
   * 서비스 정보
   */
  const dtlState =
    chartState?.serviceDetail || {};

  const svcType = dtlState?.svcType;

  /*
   * API 호출 순위
   */
  const apiRankList =
    chartState?.rank?.apiRankList || [];

  /*
   * 차트 유형
   */
  const [selectedChartType, setSelectedChartType] =
    useState('callCnt');

  /*
   * Line Chart
   */
  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState([]);

  const [
    tempSelectedOptions,
    setTempSelectedOptions,
  ] = useState([]);

  const [lineChartDateRange, setLineChartDateRange] =
    useState({
      startDate: dayjs()
        .subtract(7, 'day')
        .format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    });

  /*
   * Bar Chart
   */
  const [
    barChartSelected,
    setBarChartSelected,
  ] = useState([]);

  const [
    barChartTempSelected,
    setBarChartTempSelected,
  ] = useState([]);

  const [
    isBarChartDropdownOpen,
    setIsBarChartDropdownOpen,
  ] = useState(false);

  const [
    barChartSearchTerm,
    setBarChartSearchTerm,
  ] = useState('');

  const [barChartDateRange, setBarChartDateRange] =
    useState({
      startDate: dayjs()
        .subtract(7, 'day')
        .format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    });

  /*
   * Scatter Chart
   */
  const [
    scatterChartSelected,
    setScatterChartSelected,
  ] = useState([]);

  const [
    scatterChartTempSelected,
    setScatterChartTempSelected,
  ] = useState([]);

  const [
    scatterChartSearchTerm,
    setScatterChartSearchTerm,
  ] = useState('');

  const [
    scatterChartDateRange,
    setScatterChartDateRange,
  ] = useState({
    startDate: dayjs()
      .subtract(7, 'day')
      .format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  const [
    isScatterChartDropdownOpen,
    setIsScatterChartDropdownOpen,
  ] = useState(false);

  /*
   * 테이블
   */
  const apiRes = tableState?.apiRes || [];
  const responseCode =
    tableState?.responseCode || [];

  const total = Number(tableState?.total || 0);

  const fetchApiResListLoading =
    tableState?.fetchApiResListLoading || false;

  const [tableFilter, setTableFilter] =
    useState({});

  const [tableSorter, setTableSorter] =
    useState(defaultTableSorter);

  const [pageSize, setPageSize] =
    useState(defaultPageSize);

  const [pageNum, setPageNum] =
    useState(1);

  /*
   * 대시보드
   */
  const dashState =
    apiCallState?.dash?.apiTot || {};

  const dashLoading =
    apiCallState?.dash?.fetchApiTotLoading || false;

  /*
   * Confirm
   */
  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    confirmMessage,
    setConfirmMessage,
  ] = useState('');

  const [
    isBarChartModalOpen,
    setIsBarChartModalOpen,
  ] = useState(false);

  const [
    barChartConfirmMessage,
    setBarChartConfirmMessage,
  ] = useState('');

  /*
   * Key 선택 상태
   */
  const [apiInfo, setApiInfo] =
    useState(() => buildInitialApiInfo());

  const {
    selectedKeyId,
    selectedKeyName,
  } = apiInfo;

  const [keyList, setKeyList] =
    useState([]);

  const [
    isKeyListLoading,
    setIsKeyListLoading,
  ] = useState(false);

  const [
    isKeyListLoaded,
    setIsKeyListLoaded,
  ] = useState(false);

  /*
   * Line Chart CustomSelect
   */
  const [
    isDropdownOpen,
    setIsDropdownOpen,
  ] = useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  /*
   * 관리자·담당자:
   * - 전체 Key 조회 옵션
   * - 서비스에 구독된 모든 Key
   *
   * 일반 사용자:
   * - 권한 범위에서 조회된 구독 Key만 표시
   *
   * Key가 없으면 빈 options를 반환한다.
   */
  const keyOptions = useMemo(() => {
    if (keyList.length === 0) {
      return [];
    }

    const baseOptions = keyList.map((item) => ({
      label: item?.keyName || '-',
      value: item?.keyId,
    }));

    if (!isMngMode) {
      return baseOptions;
    }

    return [
      {
        label: '전체 Key 조회',
        value: ALL_KEY_VALUE,
      },
      ...baseOptions,
    ];
  }, [isMngMode, keyList]);

  /*
   * Select에 표시할 실제 값
   */
  const selectedKeyValue = useMemo(() => {
    if (
      !isPermissionResolved ||
      !isKeyListLoaded ||
      isKeyListLoading ||
      keyList.length === 0
    ) {
      return undefined;
    }

    const selectedKeyExists = keyList.some(
      (key) =>
        String(key.keyId) ===
        String(selectedKeyId),
    );

    if (selectedKeyExists) {
      return selectedKeyId;
    }

    /*
     * 관리자·담당자의 selectedKeyId가 null이면
     * 전체 Key 조회가 선택된 상태다.
     */
    if (isMngMode) {
      return ALL_KEY_VALUE;
    }

    /*
     * 일반 사용자는 전체 조회가 불가능하다.
     * 안전장치로 첫 번째 Key를 표시한다.
     *
     * 실제 apiInfo 상태도 Key 목록 조회 effect에서
     * 첫 번째 Key로 설정된다.
     */
    return keyList[0]?.keyId;
  }, [
    isPermissionResolved,
    isKeyListLoaded,
    isKeyListLoading,
    isMngMode,
    keyList,
    selectedKeyId,
  ]);

  /*
   * Key 목록 조회
   */
  useEffect(() => {
    if (!svcId || !isPermissionResolved) {
      return undefined;
    }

    const abortController =
      new AbortController();

    const fetchKeyList = async () => {
      setIsKeyListLoading(true);
      setIsKeyListLoaded(false);

      try {
        /*
         * 관리자·담당자:
         * 서비스에 구독된 모든 Key 조회
         *
         * 일반 사용자:
         * 사용자에게 허용된 구독 Key 조회
         */
        const keyApiUrl = isMngMode
          ? `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiAllKeyList`
          : `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiKeyList`;

        const response = await axios.get(
          keyApiUrl,
          {
            params: {
              svcId,
            },
            signal: abortController.signal,
          },
        );

        const responseList = Array.isArray(
          response?.data?.response,
        )
          ? response.data.response
          : [];

        /*
         * Key ID가 없는 데이터 제거 및 중복 제거
         */
        const keyMap = new Map();

        responseList.forEach((item) => {
          if (
            item?.keyId === null ||
            item?.keyId === undefined ||
            item?.keyId === ''
          ) {
            return;
          }

          const mapKey =
            String(item.keyId);

          if (keyMap.has(mapKey)) {
            return;
          }

          keyMap.set(mapKey, {
            keyId: item.keyId,
            keyName: item.keyName,
            appNm: item.appNm,
            prjId: item.prjId,
            authCd: item.authCd,
            regUserNm: item.regUserNm,
            regUserId: item.ownerId,
            regDttm: item.regDttm,
            svcId: item.svcId,
          });
        });

        const transformedData =
          Array.from(keyMap.values());

        setKeyList(transformedData);

        setApiInfo((prev) => {
          /*
           * 저장되어 있던 Key가 현재 조회 결과에 존재하는지 확인한다.
           */
          const matchedKey =
            transformedData.find(
              (item) =>
                String(item.keyId) ===
                String(prev.selectedKeyId),
            );

          /*
           * 저장된 Key가 현재 목록에 있으면 그대로 선택한다.
           */
          if (matchedKey) {
            return {
              selectedKeyId:
                matchedKey.keyId,
              selectedKeyName:
                matchedKey.keyName || '',
            };
          }

          /*
           * 구독 Key가 없으면 선택값 제거
           */
          if (
            transformedData.length === 0
          ) {
            return {
              selectedKeyId: null,
              selectedKeyName: '',
            };
          }

          /*
           * 관리자·담당자는 저장된 Key가 없으면
           * 기본적으로 전체 조회를 선택한다.
           *
           * selectedKeyId가 null이면
           * 차트 API에 keyId를 전달하지 않는다.
           */
          if (isMngMode) {
            return {
              selectedKeyId: null,
              selectedKeyName: '',
            };
          }

          /*
           * 일반 사용자는 전체 조회할 수 없으므로
           * 첫 번째 구독 Key를 기본 선택한다.
           */
          const firstKey =
            transformedData[0];

          return {
            selectedKeyId: firstKey.keyId,
            selectedKeyName:
              firstKey.keyName || '',
          };
        });
      } catch (error) {
        const isCanceled =
          axios.isCancel(error) ||
          error?.name === 'CanceledError' ||
          error?.code === 'ERR_CANCELED';

        if (isCanceled) {
          return;
        }

        console.error(
          'Key list fetch error:',
          error,
        );

        setKeyList([]);

        setApiInfo({
          selectedKeyId: null,
          selectedKeyName: '',
        });
      } finally {
        if (
          !abortController.signal.aborted
        ) {
          setIsKeyListLoading(false);
          setIsKeyListLoaded(true);
        }
      }
    };

    fetchKeyList();

    return () => {
      abortController.abort();
    };
  }, [
    svcId,
    isPermissionResolved,
    isMngMode,
  ]);

  /*
   * 확정된 Key 선택값을 localStorage에 저장
   */
  useEffect(() => {
    if (
      !svcId ||
      !isKeyListLoaded ||
      isKeyListLoading
    ) {
      return;
    }

    const storageApiInfo =
      getApiInfo() || {};

    localStorage.setItem(
      'apiInfo',
      JSON.stringify({
        ...storageApiInfo,
        svcId,
        keyId: selectedKeyId,
        keyName: selectedKeyName,
      }),
    );
  }, [
    svcId,
    isKeyListLoaded,
    isKeyListLoading,
    selectedKeyId,
    selectedKeyName,
  ]);

  /*
   * 현재 선택한 차트 유형의 날짜 범위
   */
  const dateRangeByChartType = useMemo(() => {
    switch (selectedChartType) {
      case 'callCnt':
        return lineChartDateRange;

      case 'errorCnt':
        return barChartDateRange;

      case 'respCnt':
        return scatterChartDateRange;

      default:
        return lineChartDateRange;
    }
  }, [
    selectedChartType,
    lineChartDateRange,
    barChartDateRange,
    scatterChartDateRange,
  ]);

  /*
   * 현재 선택한 차트 유형의 API URL 목록
   */
  const apiUrlListByChartType = useMemo(() => {
    switch (selectedChartType) {
      case 'callCnt':
        return selectedOptions;

      case 'errorCnt':
        return barChartSelected;

      case 'respCnt':
        return scatterChartSelected;

      default:
        return selectedOptions;
    }
  }, [
    selectedChartType,
    selectedOptions,
    barChartSelected,
    scatterChartSelected,
  ]);

  /*
   * 관리자·담당자 전체 조회:
   * {}
   *
   * 특정 Key 조회:
   * { keyId: selectedKeyId }
   */
  const monitoringKeyParams =
    useMemo(() => {
      if (
        selectedKeyId === null ||
        selectedKeyId === undefined ||
        selectedKeyId === ''
      ) {
        return {};
      }

      return {
        keyId: selectedKeyId,
      };
    }, [selectedKeyId]);

  /*
   * 모니터링 API 호출 준비 여부
   *
   * 관리자·담당자:
   * - Key 목록이 하나 이상 있어야 한다.
   * - selectedKeyId가 null이어도 전체 조회 가능
   *
   * 일반 사용자:
   * - Key 목록이 하나 이상 있어야 한다.
   * - 특정 selectedKeyId가 반드시 필요
   */
  const isMonitoringReady =
    Boolean(svcId) &&
    Boolean(svcType) &&
    isPermissionResolved &&
    isKeyListLoaded &&
    !isKeyListLoading &&
    keyList.length > 0 &&
    (
      isMngMode ||
      (
        selectedKeyId !== null &&
        selectedKeyId !== undefined &&
        selectedKeyId !== ''
      )
    );

  /*
   * 요청 종류별 직전 파라미터
   *
   * 기존처럼 하나의 ref를 여러 요청이 공유하면
   * Rank 요청과 Chart 요청이 서로 중복 요청으로 오판할 수 있다.
   */
  const previousRequestParamsRef =
    useRef({
      rank: null,
      chart: null,
      table: null,
    });

  const shouldMakeApiCall = useCallback(
    (requestType, newParams) => {
      const currentParams =
        JSON.stringify(newParams);

      const previousParams =
        previousRequestParamsRef.current[
          requestType
        ];

      if (
        currentParams === previousParams
      ) {
        return false;
      }

      previousRequestParamsRef.current = {
        ...previousRequestParamsRef.current,
        [requestType]: currentParams,
      };

      return true;
    },
    [],
  );

  /*
   * 서비스 또는 권한 범위가 바뀌면
   * 이전 중복 호출 비교값을 초기화한다.
   */
  useEffect(() => {
    previousRequestParamsRef.current = {
      rank: null,
      chart: null,
      table: null,
    };
  }, [
    svcId,
    isMngMode,
  ]);

  /*
   * API Rank 결과가 변경되면
   * 각 차트의 선택 API를 현재 Rank 목록에 맞게 보정한다.
   */
  useEffect(() => {
    if (
      !svcType ||
      !Array.isArray(apiRankList) ||
      apiRankList.length === 0
    ) {
      return;
    }

    const getSortedApis = () =>
      [...apiRankList]
        .sort(
          (a, b) =>
            Number(b?.cnt || 0) -
            Number(a?.cnt || 0),
        )
        .slice(0, 5)
        .map(
          (api) =>
            `${upperCase(
              api?.method || '',
            )}:${api?.apiUrl || ''}`,
        );

    const normalizeSelection = (
      currentSelection,
    ) => {
      if (
        !Array.isArray(currentSelection)
      ) {
        return getSortedApis();
      }

      const validSelections =
        currentSelection.filter(
          (option) => {
            const {
              method,
              apiUrl,
            } = parseApiOptionValue(
              option,
            );

            return apiRankList.some(
              (api) =>
                String(
                  api?.method || '',
                ).toLowerCase() ===
                  method &&
                api?.apiUrl === apiUrl,
            );
          },
        );

      return validSelections.length > 0
        ? validSelections.slice(0, 5)
        : getSortedApis();
    };

    const nextLineSelection =
      normalizeSelection(
        tempSelectedOptions,
      );

    const nextBarSelection =
      normalizeSelection(
        barChartTempSelected,
      );

    const nextScatterSelection =
      normalizeSelection(
        scatterChartTempSelected,
      );

    setSelectedOptions(
      nextLineSelection,
    );

    setTempSelectedOptions(
      nextLineSelection,
    );

    setBarChartSelected(
      nextBarSelection,
    );

    setBarChartTempSelected(
      nextBarSelection,
    );

    setScatterChartSelected(
      nextScatterSelection,
    );

    setScatterChartTempSelected(
      nextScatterSelection,
    );
  }, [
    svcType,
    apiRankList,
  ]);

  /*
   * Rank 목록이 비어 있으면
   * 이전 서비스 또는 이전 Key의 API 선택값을 제거한다.
   */
  useEffect(() => {
    if (
      !isMonitoringReady ||
      !Array.isArray(apiRankList) ||
      apiRankList.length > 0
    ) {
      return;
    }

    setSelectedOptions([]);
    setTempSelectedOptions([]);
    setBarChartSelected([]);
    setBarChartTempSelected([]);
    setScatterChartSelected([]);
    setScatterChartTempSelected([]);
  }, [
    isMonitoringReady,
    apiRankList,
  ]);

  /*
   * API Rank 조회
   */
  useEffect(() => {
    if (!isMonitoringReady) {
      return;
    }

    const {
      startDate,
      endDate,
    } = dateRangeByChartType;

    if (!startDate || !endDate) {
      return;
    }

    const callParams = {
      startDate,
      endDate,
      svcType,
      svcId,
      ...monitoringKeyParams,
    };

    if (
      !shouldMakeApiCall(
        'rank',
        callParams,
      )
    ) {
      return;
    }

    dispatch(
      fetchApiRankList(callParams),
    );
  }, [
    dispatch,
    isMonitoringReady,
    svcType,
    svcId,
    monitoringKeyParams,
    dateRangeByChartType,
    shouldMakeApiCall,
  ]);

  /*
   * 차트 데이터, 응답 코드, 대시보드 조회
   */
  useEffect(() => {
    if (!isMonitoringReady) {
      return;
    }

    const {
      startDate,
      endDate,
    } = dateRangeByChartType;

    if (!startDate || !endDate) {
      return;
    }

    if (
      !Array.isArray(
        apiUrlListByChartType,
      )
    ) {
      return;
    }

    const callParams = {
      startDate,
      endDate,
      svcType,
      svcId,
      ...monitoringKeyParams,
      apiUrl: apiUrlListByChartType,
    };

    const compareParams = {
      ...callParams,
      selectedChartType,
    };

    if (
      !shouldMakeApiCall(
        'chart',
        compareParams,
      )
    ) {
      return;
    }

    switch (selectedChartType) {
      case 'callCnt':
        dispatch(
          fetchApiCallList(callParams),
        );
        break;

      case 'errorCnt':
        dispatch(
          fetchApiErrorList(callParams),
        );
        break;

      case 'respCnt':
        dispatch(
          fetchApiResultList(callParams),
        );
        break;

      default:
        return;
    }

    dispatch(
      fetchResponseCode(callParams),
    );

    dispatch(
      fetchApiTot(callParams),
    );
  }, [
    dispatch,
    isMonitoringReady,
    selectedChartType,
    svcType,
    svcId,
    monitoringKeyParams,
    dateRangeByChartType,
    apiUrlListByChartType,
    shouldMakeApiCall,
  ]);

  /*
   * Key, 차트, 필터 조건 변경 시 첫 페이지로 이동
   */
  useEffect(() => {
    setPageNum(1);
  }, [
    selectedKeyId,
    selectedChartType,
    pageSize,
    tableSorter,
    tableFilter,
    dateRangeByChartType,
    apiUrlListByChartType,
  ]);

  /*
   * 하단 테이블 조회
   */
  useEffect(() => {
    if (!isMonitoringReady) {
      return;
    }

    const {
      startDate,
      endDate,
    } = dateRangeByChartType;

    if (!startDate || !endDate) {
      return;
    }

    if (
      !Array.isArray(
        apiUrlListByChartType,
      ) ||
      apiUrlListByChartType.length === 0
    ) {
      return;
    }

    const callParams = {
      startDate,
      endDate,
      svcType,
      svcId,
      ...monitoringKeyParams,
      responseCode:
        tableFilter?.responseCode,
      sort: tableSorter.sort,
      sortField:
        tableSorter.sortField,
      pageNum,
      pageSize,
      apiUrl: apiUrlListByChartType,
    };

    if (
      !shouldMakeApiCall(
        'table',
        callParams,
      )
    ) {
      return;
    }

    dispatch(
      fetchApiRes(callParams),
    );
  }, [
    dispatch,
    isMonitoringReady,
    svcType,
    svcId,
    monitoringKeyParams,
    dateRangeByChartType,
    apiUrlListByChartType,
    tableFilter,
    tableSorter,
    pageNum,
    pageSize,
    shouldMakeApiCall,
  ]);

  /*
   * Key Select 변경
   */
  const handleSelectKeyChange =
    useCallback(
      (selectedValue) => {
        /*
         * 전체 조회는 관리자·담당자만 가능
         */
        if (
          selectedValue ===
          ALL_KEY_VALUE
        ) {
          if (!isMngMode) {
            return;
          }

          setApiInfo({
            selectedKeyId: null,
            selectedKeyName: '',
          });

          setPageNum(1);
          return;
        }

        const selectedData =
          keyList.find(
            (key) =>
              String(key.keyId) ===
              String(selectedValue),
          );

        if (!selectedData) {
          return;
        }

        setApiInfo({
          selectedKeyId:
            selectedData.keyId,
          selectedKeyName:
            selectedData.keyName || '',
        });

        setPageNum(1);
      },
      [
        isMngMode,
        keyList,
      ],
    );

  /*
   * Line Chart CustomSelect
   */
  const toggleDropdown =
    useCallback(() => {
      setIsDropdownOpen((prev) => {
        if (prev) {
          setSearchTerm('');
        }

        return !prev;
      });
    }, []);

  const handleSearchChange =
    useCallback((event) => {
      setSearchTerm(
        event?.target?.value || '',
      );
    }, []);

  const handleChange =
    useCallback((selectedValues) => {
      const values = Array.isArray(
        selectedValues,
      )
        ? selectedValues
        : [];

      if (values.length > 5) {
        setIsModalOpen(true);

        setConfirmMessage(
          intlObj.get(
            message[
              'store.warning.maxSelectIs5'
            ],
          ),
        );

        setTempSelectedOptions(
          values.slice(0, 5),
        );

        return;
      }

      setTempSelectedOptions(values);
    }, []);

  const handleCancel =
    useCallback(() => {
      setTempSelectedOptions(
        selectedOptions,
      );

      setIsModalOpen(false);

      setIsDropdownOpen(false);
      setSearchTerm('');
    }, [selectedOptions]);

  const handleConfirm =
    useCallback(() => {
      if (
        tempSelectedOptions.length === 0
      ) {
        setIsModalOpen(true);

        setConfirmMessage(
          intlObj.get(
            message[
              'store.validation.selectAtLeastOne'
            ],
          ),
        );

        return;
      }

      setSelectedOptions(
        tempSelectedOptions,
      );

      setIsDropdownOpen(false);
      setSearchTerm('');
    }, [tempSelectedOptions]);

  const handleCallTopBtnClick =
    useCallback(() => {
      const topApiValues =
        [...apiRankList]
          .sort(
            (a, b) =>
              Number(b?.cnt || 0) -
              Number(a?.cnt || 0),
          )
          .slice(0, 5)
          .map(
            (api) =>
              `${upperCase(
                api?.method || '',
              )}:${api?.apiUrl || ''}`,
          );

      setSelectedOptions(
        topApiValues,
      );

      setTempSelectedOptions(
        topApiValues,
      );

      setIsDropdownOpen(false);
      setSearchTerm('');
    }, [apiRankList]);

  /*
   * Bar Chart CustomSelect
   */
  const toggleBarChartDropdown =
    useCallback(() => {
      setIsBarChartDropdownOpen(
        (prev) => {
          if (prev) {
            setBarChartSearchTerm('');
          }

          return !prev;
        },
      );
    }, []);

  const handleBarChartSearchChange =
    useCallback((event) => {
      setBarChartSearchTerm(
        event?.target?.value || '',
      );
    }, []);

  const handleBarChartChange =
    useCallback((selectedValues) => {
      const values = Array.isArray(
        selectedValues,
      )
        ? selectedValues
        : [];

      if (values.length > 5) {
        setIsBarChartModalOpen(true);

        setBarChartConfirmMessage(
          intlObj.get(
            message[
              'store.warning.maxSelectIs5'
            ],
          ),
        );

        setBarChartTempSelected(
          values.slice(0, 5),
        );

        return;
      }

      setBarChartTempSelected(values);
    }, []);

  const handleBarChartConfirm =
    useCallback(() => {
      if (
        barChartTempSelected.length === 0
      ) {
        setIsBarChartModalOpen(true);

        setBarChartConfirmMessage(
          intlObj.get(
            message[
              'store.validation.selectAtLeastOne'
            ],
          ),
        );

        return;
      }

      setBarChartSelected(
        barChartTempSelected,
      );

      setIsBarChartDropdownOpen(false);
      setBarChartSearchTerm('');
    }, [barChartTempSelected]);

  const handleBarChartCancel =
    useCallback(() => {
      setBarChartTempSelected(
        barChartSelected,
      );

      setIsBarChartModalOpen(false);
      setIsBarChartDropdownOpen(false);
      setBarChartSearchTerm('');
    }, [barChartSelected]);

  const handleBarChartCallTopBtnClick =
    useCallback(() => {
      const topApiValues =
        [...apiRankList]
          .sort(
            (a, b) =>
              Number(b?.cnt || 0) -
              Number(a?.cnt || 0),
          )
          .slice(0, 5)
          .map(
            (api) =>
              `${upperCase(
                api?.method || '',
              )}:${api?.apiUrl || ''}`,
          );

      setBarChartSelected(
        topApiValues,
      );

      setBarChartTempSelected(
        topApiValues,
      );

      setIsBarChartDropdownOpen(false);
      setBarChartSearchTerm('');
    }, [apiRankList]);

  /*
   * Scatter Chart CustomSelect
   */
  const toggleScatterChartDropdown =
    useCallback(() => {
      setIsScatterChartDropdownOpen(
        (prev) => {
          if (prev) {
            setScatterChartSearchTerm('');
          }

          return !prev;
        },
      );
    }, []);

  const handleScatterChartSearchChange =
    useCallback((event) => {
      setScatterChartSearchTerm(
        event?.target?.value || '',
      );
    }, []);

  const handleScatterChartChange =
    useCallback((selectedValues) => {
      const values = Array.isArray(
        selectedValues,
      )
        ? selectedValues
        : [];

      if (values.length > 5) {
        setIsModalOpen(true);

        setConfirmMessage(
          intlObj.get(
            message[
              'store.warning.maxSelectIs5'
            ],
          ),
        );

        setScatterChartTempSelected(
          values.slice(0, 5),
        );

        return;
      }

      setScatterChartTempSelected(
        values,
      );
    }, []);

  const handleScatterChartConfirm =
    useCallback(() => {
      if (
        scatterChartTempSelected.length ===
        0
      ) {
        setIsModalOpen(true);

        setConfirmMessage(
          intlObj.get(
            message[
              'store.validation.selectAtLeastOne'
            ],
          ),
        );

        return;
      }

      setScatterChartSelected(
        scatterChartTempSelected,
      );

      setIsScatterChartDropdownOpen(
        false,
      );

      setScatterChartSearchTerm('');
    }, [scatterChartTempSelected]);

  const handleScatterChartCancel =
    useCallback(() => {
      setScatterChartTempSelected(
        scatterChartSelected,
      );

      setIsModalOpen(false);

      setIsScatterChartDropdownOpen(
        false,
      );

      setScatterChartSearchTerm('');
    }, [scatterChartSelected]);

  const handleScatterChartCallTopBtnClick =
    useCallback(() => {
      const topApiValues =
        [...apiRankList]
          .sort(
            (a, b) =>
              Number(b?.cnt || 0) -
              Number(a?.cnt || 0),
          )
          .slice(0, 5)
          .map(
            (api) =>
              `${upperCase(
                api?.method || '',
              )}:${api?.apiUrl || ''}`,
          );

      setScatterChartSelected(
        topApiValues,
      );

      setScatterChartTempSelected(
        topApiValues,
      );

      setIsScatterChartDropdownOpen(
        false,
      );

      setScatterChartSearchTerm('');
    }, [apiRankList]);

  /*
   * 차트 유형 변경
   */
  const handleChartTypeChange =
    useCallback((selectedValue) => {
      setSelectedChartType(
        selectedValue,
      );
    }, []);

  /*
   * 날짜 변경
   */
  const handleDateChange =
    useCallback((dates) => {
      if (
        !dates ||
        dates.length !== 2
      ) {
        return;
      }

      const [startDate, endDate] =
        dates;

      if (!startDate || !endDate) {
        return;
      }

      setLineChartDateRange({
        startDate: dayjs(
          startDate,
        ).format('YYYY-MM-DD'),
        endDate: dayjs(
          endDate,
        ).format('YYYY-MM-DD'),
      });
    }, []);

  const handleBarChartDateChange =
    useCallback((dates) => {
      if (
        !dates ||
        dates.length !== 2
      ) {
        return;
      }

      const [startDate, endDate] =
        dates;

      if (!startDate || !endDate) {
        return;
      }

      setBarChartDateRange({
        startDate: dayjs(
          startDate,
        ).format('YYYY-MM-DD'),
        endDate: dayjs(
          endDate,
        ).format('YYYY-MM-DD'),
      });
    }, []);

  const handleScatterChartDateChange =
    useCallback((dates) => {
      if (
        !dates ||
        dates.length !== 2
      ) {
        return;
      }

      const [startDate, endDate] =
        dates;

      if (!startDate || !endDate) {
        return;
      }

      setScatterChartDateRange({
        startDate: dayjs(
          startDate,
        ).format('YYYY-MM-DD'),
        endDate: dayjs(
          endDate,
        ).format('YYYY-MM-DD'),
      });
    }, []);

  /*
   * 테이블 필터
   */
  const handleChangeTableFilter =
    useCallback((filters, action) => {
      if (action?.action !== 'filter') {
        return;
      }

      setTableFilter(
        filters || {},
      );
    }, []);

  /*
   * 테이블 정렬
   */
  const handleChangeTableSorter =
    useCallback((sorter, action) => {
      if (action?.action !== 'sort') {
        return;
      }

      setTableSorter({
        sort:
          sorter?.order === 'ascend'
            ? 'ASC'
            : sorter?.order ===
                'descend'
              ? 'DESC'
              : null,
        sortField: sorter?.order
          ? sorter?.column?.key
          : null,
      });
    }, []);

  /*
   * 대시보드 데이터
   *
   * 현재 모든 차트 유형이 동일한 dashState를 사용하므로
   * switch를 제거해 단순화한다.
   */
  const dashboardData = useMemo(
    () => ({
      userCnt:
        Number(dashState?.userCnt || 0),
      callCnt:
        Number(dashState?.callCnt || 0),
      avgTime:
        Number(dashState?.avgTime || 0),
      errorCnt:
        Number(dashState?.errorCnt || 0),
    }),
    [dashState],
  );

  const tableData = useMemo(
    () =>
      Array.isArray(apiRes)
        ? apiRes
        : [],
    [apiRes],
  );

  const tableColumn = useMemo(
    () => [
      {
        title: intlObj.get(
          message['store.project'],
        ),
        dataIndex: 'prjId',
        width: '15%',
        resize: true,
        align: 'center',
        ellipsis: true,
      },
      {
        title: intlObj.get(
          message['store.apiReqTime'],
        ),
        key: 'timestamp',
        dataIndex: 'timestamp',
        width: '15%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: true,
        sortDirections: [
          'ascend',
          'descend',
          null,
        ],
        render: (text) => {
          if (!text) {
            return '-';
          }

          const date = new Date(text);

          if (
            Number.isNaN(date.getTime())
          ) {
            return '-';
          }

          const year =
            date.getFullYear();

          const month = String(
            date.getMonth() + 1,
          ).padStart(2, '0');

          const day = String(
            date.getDate(),
          ).padStart(2, '0');

          const hours = String(
            date.getHours(),
          ).padStart(2, '0');

          const minutes = String(
            date.getMinutes(),
          ).padStart(2, '0');

          const seconds = String(
            date.getSeconds(),
          ).padStart(2, '0');

          return (
            `${year}-${month}-${day} ` +
            `${hours}:${minutes}:${seconds}`
          );
        },
      },
      {
        title: intlObj.get(
          message['store.keyName'],
        ),
        dataIndex: 'keyName',
        width: '13%',
        resize: true,
        align: 'center',
        ellipsis: true,
        render: (text) => text || '-',
      },
      {
        title: intlObj.get(
          message['store.keyType'],
        ),
        dataIndex: 'authCd',
        width: '7%',
        resize: true,
        align: 'center',
        ellipsis: true,
        render: (text) => {
          if (text === 'SYS') {
            return intlObj.get(
              message['store.system'],
            );
          }

          if (text === 'PSN') {
            return intlObj.get(
              message['store.personal'],
            );
          }

          return '-';
        },
      },
      {
        title: intlObj.get(
          message[
            'store.keyConnectionInfo'
          ],
        ),
        width: '11%',
        resize: true,
        align: 'center',
        ellipsis: true,
        render: (_, record) => {
          const keyOwnerName =
            record?.keyOwnerName;

          const keyOwnerId =
            record?.keyOwnerId;

          const systemName =
            record?.appNm;

          if (record?.authCd === 'PSN') {
            if (
              !keyOwnerName &&
              !keyOwnerId
            ) {
              return '-';
            }

            return `${keyOwnerName || '-'} (${keyOwnerId || '-'})`;
          }

          if (record?.authCd === 'SYS') {
            return systemName || '-';
          }

          return '-';
        },
      },
      {
        title: intlObj.get(
          message['store.statusCode'],
        ),
        dataIndex: 'responseCode',
        width: '10%',
        resize: true,
        align: 'center',
        ellipsis: true,
        render: (text) => text || '-',
        filters: [...responseCode]
          .sort(
            (a, b) =>
              Number(a) - Number(b),
          )
          .map((code) => ({
            text: code,
            value: code,
          })),
      },
      {
        title: 'API',
        key: 'apiPath.keyword',
        dataIndex: 'api',
        width: '22%',
        resize: true,
        ellipsis: true,
        showSorterTooltip: false,
        sorter: true,
        sortDirections: [
          'ascend',
          'descend',
          null,
        ],
        render: (text, record) => {
          const method =
            record?.method || '-';

          return `(${method}) ${text || '-'}`;
        },
      },
      {
        title: intlObj.get(
          message['store.responseTime'],
        ),
        key: 'responseTime',
        dataIndex: 'responseTime',
        width: '7%',
        resize: true,
        align: 'center',
        ellipsis: true,
        showSorterTooltip: false,
        sorter: true,
        sortDirections: [
          'ascend',
          'descend',
          null,
        ],
        render: (text) => {
          if (
            text === null ||
            text === undefined ||
            text === ''
          ) {
            return '-';
          }

          return `${formatNumberWithComma(
            text,
          )} ms`;
        },
      },
    ],
    [responseCode],
  );

  const chartApiOptions =
    useMemo(() => {
      if (
        !Array.isArray(apiRankList)
      ) {
        return [];
      }

      return apiRankList.map(
        (api) => ({
          value:
            `${upperCase(
              api?.method || '',
            )}:${api?.apiUrl || ''}`,
          label:
            `(${upperCase(
              api?.method || '',
            )}) ${api?.apiUrl || ''}`,
        }),
      );
    }, [apiRankList]);

  const isKeySelectDisabled =
    !isPermissionResolved ||
    isKeyListLoading ||
    (
      isKeyListLoaded &&
      keyList.length === 0
    );

  const keySelectPlaceholder =
    !isPermissionResolved ||
    isKeyListLoading
      ? 'Key 조회 중입니다.'
      : isKeyListLoaded &&
          keyList.length === 0
        ? intlObj.get(
            message[
              'store.noSubscribedKey'
            ],
          )
        : intlObj.get(
            message['store.selectKey'],
          );

  return (
    <>
      <Division flex={true} gap={10}>
        <Select
          width={150}
          placeholder={intlObj.get(
            message['store.callCount'],
          )}
          value={selectedChartType}
          options={firstOptions}
          onChange={handleChartTypeChange}
        />

        {selectedChartType ===
          'callCnt' && (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CustomSelect
              placeholder="API Call best top 5"
              options={chartApiOptions}
              value={tempSelectedOptions}
              onChange={handleChange}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              isOpen={isDropdownOpen}
              toggleDropdown={
                toggleDropdown
              }
              searchTerm={searchTerm}
              handleSearchChange={
                handleSearchChange
              }
              handleCallTopBtnClick={
                handleCallTopBtnClick
              }
            />
          </div>
        )}

        {selectedChartType ===
          'errorCnt' && (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CustomSelect
              placeholder="API Call best top 5"
              options={chartApiOptions}
              value={
                barChartTempSelected
              }
              onChange={
                handleBarChartChange
              }
              onConfirm={
                handleBarChartConfirm
              }
              onCancel={
                handleBarChartCancel
              }
              isOpen={
                isBarChartDropdownOpen
              }
              toggleDropdown={
                toggleBarChartDropdown
              }
              searchTerm={
                barChartSearchTerm
              }
              handleSearchChange={
                handleBarChartSearchChange
              }
              handleCallTopBtnClick={
                handleBarChartCallTopBtnClick
              }
            />
          </div>
        )}

        {selectedChartType ===
          'respCnt' && (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CustomSelect
              placeholder="API Call best top 5"
              options={chartApiOptions}
              value={
                scatterChartTempSelected
              }
              onChange={
                handleScatterChartChange
              }
              onConfirm={
                handleScatterChartConfirm
              }
              onCancel={
                handleScatterChartCancel
              }
              isOpen={
                isScatterChartDropdownOpen
              }
              toggleDropdown={
                toggleScatterChartDropdown
              }
              searchTerm={
                scatterChartSearchTerm
              }
              handleSearchChange={
                handleScatterChartSearchChange
              }
              handleCallTopBtnClick={
                handleScatterChartCallTopBtnClick
              }
            />
          </div>
        )}

        {selectedChartType ===
          'callCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(
                lineChartDateRange.startDate,
              ),
              dayjs(
                lineChartDateRange.endDate,
              ),
            ]}
            onChange={handleDateChange}
            allowClear={false}
          />
        )}

        {selectedChartType ===
          'errorCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(
                barChartDateRange.startDate,
              ),
              dayjs(
                barChartDateRange.endDate,
              ),
            ]}
            onChange={
              handleBarChartDateChange
            }
            allowClear={false}
          />
        )}

        {selectedChartType ===
          'respCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(
                scatterChartDateRange.startDate,
              ),
              dayjs(
                scatterChartDateRange.endDate,
              ),
            ]}
            onChange={
              handleScatterChartDateChange
            }
            allowClear={false}
          />
        )}

        <span>
          <Select
            placeholder={
              keySelectPlaceholder
            }
            width={240}
            value={selectedKeyValue}
            options={keyOptions}
            onChange={
              handleSelectKeyChange
            }
            disabled={
              isKeySelectDisabled
            }
          />
        </span>
      </Division>

      <div
        style={{
          marginBottom: '20px',
        }}
      >
        {selectedChartType ===
        'callCnt' ? (
          <LineChart
            startDate={
              lineChartDateRange.startDate
            }
            endDate={
              lineChartDateRange.endDate
            }
            apiUrl={selectedOptions}
          />
        ) : selectedChartType ===
          'errorCnt' ? (
          <BarChart
            startDate={
              barChartDateRange.startDate
            }
            endDate={
              barChartDateRange.endDate
            }
            apiUrl={barChartSelected}
          />
        ) : (
          <ScatterChart
            startDate={
              scatterChartDateRange.startDate
            }
            endDate={
              scatterChartDateRange.endDate
            }
            apiUrl={
              scatterChartSelected
            }
          />
        )}
      </div>

      <Spin spinning={dashLoading}>
        <Division flex={true} gap={30}>
          <Dashboard
            iconSrc={icon_person}
            color="#E7E8F8"
            title={intlObj.get(
              message['store.userCount'],
            )}
            count={formatNumberWithComma(
              dashboardData.userCnt,
            )}
            className="dash"
            dashNumColor="#333333"
          />

          <Dashboard
            iconSrc={icon_cpm_api}
            color="#F1F7FF"
            title={intlObj.get(
              message[
                'store.apiCallCount'
              ],
            )}
            count={formatNumberWithComma(
              dashboardData.callCnt,
            )}
            className="dash"
            dashNumColor="#333333"
          />

          <Dashboard
            iconSrc={icon_time}
            color="#F1F7FF"
            title={intlObj.get(
              message[
                'store.averageResponseTime'
              ],
            )}
            count={formatNumberWithComma(
              dashboardData.avgTime,
            )}
            unit={
              dashboardData.avgTime !== 0
                ? 'ms'
                : undefined
            }
            className="dash"
            dashNumColor="#333333"
          />

          <Dashboard
            iconSrc={icon_error}
            color="#FFF5F5"
            title={intlObj.get(
              message['store.errorCount'],
            )}
            count={formatNumberWithComma(
              dashboardData.errorCnt,
            )}
            className="dash"
            dashNumColor="#FF0016"
          />
        </Division>
      </Spin>

      <Division mt={40}>
        <Table
          loading={
            fetchApiResListLoading
          }
          columns={tableColumn}
          dataSource={tableData}
          type="normal"
          pagination={{
            position: [
              'bottomCenter',
            ],
            showAllItems: true,
            total,
            pageSize,
            current: pageNum,
            onChange: (nextPageNum) =>
              setPageNum(nextPageNum),
          }}
          paginationExtraContent={
            <Select
              value={pageSize}
              options={
                pageSizeOptions
              }
              onSelect={(
                _,
                option,
              ) => {
                const nextPageSize =
                  option?.value;

                if (
                  nextPageSize ===
                    null ||
                  nextPageSize ===
                    undefined
                ) {
                  return;
                }

                setPageSize(
                  Number(
                    nextPageSize,
                  ),
                );
              }}
            />
          }
          onChange={(
            pagination,
            filters,
            sorter,
            action,
          ) => {
            handleChangeTableFilter(
              filters,
              action,
            );

            handleChangeTableSorter(
              sorter,
              action,
            );
          }}
          scroll={{
            y: 500,
          }}
        />
      </Division>

      <Confirm
        open={isModalOpen}
        title={intlObj.get(
          message['store.alert'],
        )}
        desc={confirmMessage}
        okText={intlObj.get(
          message['store.ok'],
        )}
        onOk={() =>
          setIsModalOpen(false)
        }
        onCancel={() =>
          setIsModalOpen(false)
        }
        hideCancel={true}
      />

      {selectedChartType ===
        'errorCnt' && (
        <Confirm
          open={
            isBarChartModalOpen
          }
          title={intlObj.get(
            message['store.alert'],
          )}
          desc={
            barChartConfirmMessage
          }
          okText={intlObj.get(
            message['store.ok'],
          )}
          onOk={() =>
            setIsBarChartModalOpen(
              false,
            )
          }
          onCancel={() =>
            setIsBarChartModalOpen(
              false,
            )
          }
          hideCancel={true}
        />
      )}
    </>
  );
};

export default ApiMonitoring;