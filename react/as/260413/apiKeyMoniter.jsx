import { useState, useEffect, useMemo, useRef } from 'react';
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
import { formatNumberWithComma } from '@/utils/commonUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Dashboard from '@/components/Organisms/Dashboard';
import Select from '@/components/Atoms/Select';
import CustomSelect from '@/components/Organisms/CustomSelect';
import DatePicker from '@/components/Organisms/DatePicker';
import Confirm from '@/components/Atoms/Confirm';
import Table from '@/components/Organisms/Table';
import Selector from '@/components/Organisms/Selector';
import Division from '@/components/Atoms/Division';
import DashKeyModal from './apiKeyModal';
import LineChart from '../chart/lineChart';
import BarChart from '../chart/barChart';
import ScatterChart from '../chart/scatterChart';

import icon_person from '@/assets/images/dashboard/icon_person.svg';
import icon_cpm_api from '@/assets/images/dashboard/icon_cpm_api.svg';
import icon_time from '@/assets/images/dashboard/icon_time.svg';
import icon_error from '@/assets/images/dashboard/icon_error.svg';

const API_MONITORING_MODE = {
  REG: 'REG',
  SUB: 'SUB',
};

const defaultTableSorter = {
  sort: null,
  sortField: null,
};

const defaultPageSize = 10;

const getSafeParsedApiInfo = () => {
  try {
    const raw = localStorage.getItem('apiInfo');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
};

const buildInitialApiInfo = (propMode) => {
  const storageApiInfo = getSafeParsedApiInfo();

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
      selectedKeyId:
        storageApiInfo?.keyId && storageApiInfo?.keyId !== 'REG'
          ? storageApiInfo.keyId
          : null,
      selectedKeyName:
        storageApiInfo?.keyId && storageApiInfo?.keyId !== 'REG'
          ? storageApiInfo?.keyName ?? ''
          : '',
    };
  }

  const legacyKeyId = storageApiInfo?.keyId;
  const inferredMode =
    legacyKeyId === 'REG'
      ? API_MONITORING_MODE.REG
      : API_MONITORING_MODE.SUB;

  return {
    mode: inferredMode,
    selectedKeyId:
      inferredMode === API_MONITORING_MODE.REG ? null : legacyKeyId ?? null,
    selectedKeyName:
      inferredMode === API_MONITORING_MODE.REG
        ? ''
        : storageApiInfo?.keyName ?? '',
  };
};

const ApiMonitoring = ({ mode: propMode }) => {
  const firstOptions = [
    { label: intlObj.get(message['store.callCount']), value: 'callCnt' },
    { label: intlObj.get(message['store.errorCount']), value: 'errorCnt' },
    { label: intlObj.get(message['store.responseTime']), value: 'respCnt' },
  ];

  const pageSizeOptions = [
    { label: intlObj.get(message['store.pageSize10']), value: 10 },
    { label: intlObj.get(message['store.pageSize30']), value: 30 },
    { label: intlObj.get(message['store.pageSize50']), value: 50 },
  ];

  const { svcId } = useParams();
  const dispatch = useDispatch();

  // 차트
  const apiCallState = useSelector((state) => state.get('dashboard')) || {};
  const chartState = apiCallState?.chart || {};
  const [selectedChartType, setSelectedChartType] = useState('callCnt');

  // 서비스 정보
  const dtlState = apiCallState?.chart?.serviceDetail || {};
  const svcType = dtlState?.svcType;

  // 호출 랭크
  const apiRankList = chartState?.rank?.apiRankList || [];

  // 모드 / 키 정보
  const [apiInfo, setApiInfo] = useState({
    mode: API_MONITORING_MODE.SUB,
    selectedKeyId: null,
    selectedKeyName: '',
  });

  const { mode, selectedKeyId, selectedKeyName } = apiInfo;
  const isRegMode = mode === API_MONITORING_MODE.REG;

  // 라인차트용 상태
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [tempSelectedOptions, setTempSelectedOptions] = useState([]);
  const [lineChartDateRange, setLineChartDateRange] = useState({
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  // BarChart용 상태
  const [barChartSelected, setBarChartSelected] = useState([]);
  const [barChartTempSelected, setBarChartTempSelected] = useState([]);
  const [isBarChartDropdownOpen, setIsBarChartDropdownOpen] = useState(false);
  const [barChartSearchTerm, setBarChartSearchTerm] = useState('');
  const [barChartDateRange, setBarChartDateRange] = useState({
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  // Scatter Chart 관련 상태
  const [scatterChartSelected, setScatterChartSelected] = useState([]);
  const [scatterChartTempSelected, setScatterChartTempSelected] = useState([]);
  const [scatterChartSearchTerm, setScatterChartSearchTerm] = useState('');
  const [scatterChartDateRange, setScatterChartDateRange] = useState({
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [isScatterChartDropdownOpen, setIsScatterChartDropdownOpen] =
    useState(false);

  // 테이블
  const tableState = apiCallState?.table || {};
  const apiRes = tableState?.apiRes || [];
  const responseCode = tableState?.responseCode || [];
  const total = tableState?.total || [];
  const fetchApiResListLoading = tableState?.fetchApiResListLoading || false;
  const [tableFilter, setTableFilter] = useState({});
  const [tableSorter, setTableSorter] = useState(defaultTableSorter);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageNum, setPageNum] = useState(1);

  // 대시보드
  const dashState = apiCallState?.dash?.apiTot || {};
  const dashLoading = apiCallState?.dash?.fetchApiTotLoading || false;

  // 모달
  const [openKeyPopup, setOpenKeyPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBarChartModalOpen, setIsBarChartModalOpen] = useState(false);

  // confirm
  const [confirmMessage, setConfirmMessage] = useState('');
  const [barChartConfirmMessage, setBarChartConfirmMessage] = useState('');

  // CustomSelectbox
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 키 관련
  const [keyList, setKeyList] = useState([]);
  const selectedKey = useMemo(
    () => keyList.find((key) => key.keyId === selectedKeyId),
    [keyList, selectedKeyId],
  );
  const keyOptions = [
    { label: '전체 조회', value: 'allSelect' },
    ...(keyList || []).map((item) => ({
      label: item?.keyName,
      value: item?.keyId,
    })),
  ];

  // 검색
  const [searchTerm, setSearchTerm] = useState('');

  const toggleScatterChartDropdown = () => {
    setIsScatterChartDropdownOpen((prev) => !prev);
  };

  // mode 초기화: prop 우선, 없으면 localStorage fallback
  useEffect(() => {
    setApiInfo(buildInitialApiInfo(propMode));
  }, [propMode]);

  // selected key localStorage 저장
  useEffect(() => {
    localStorage.setItem(
      'apiInfo',
      JSON.stringify({
        keyId: isRegMode ? 'REG' : selectedKeyId,
        keyName: isRegMode ? '' : selectedKeyName,
      }),
    );
  }, [isRegMode, selectedKeyId, selectedKeyName]);

  // key select 세팅
  const axiosGetApiKey = async () => {
    try {
      const keyApiUrl = isRegMode
        ? `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiAllKeyList`
        : `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiKeyList`;

      const response = await axios.get(keyApiUrl, {
        params: { svcId },
      });

      if (!response.status || response.status < 200 || response.status >= 300) {
        throw response;
      }

      const transformedData = (response?.data?.response || []).map((item) => ({
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

      setKeyList(transformedData);
    } catch (error) {
      console.error('Error:', error);
      setKeyList([]);
    }
  };

  useEffect(() => {
    if (!svcId) return;

    axiosGetApiKey();

    return () => setKeyList([]);
  }, [svcId, mode]);

  // 중복 호출 방지를 위한 useRef
  const previousApiCallParams = useRef(null);

  const shouldMakeApiCall = (newParams) => {
    const currentParams = JSON.stringify(newParams);
    const prevParams = previousApiCallParams.current;

    if (!prevParams || currentParams !== prevParams) {
      previousApiCallParams.current = currentParams;
      return true;
    }
    return false;
  };

  // 날짜 변경 시 선택 상태 유지
  useEffect(() => {
    if (!svcType || apiRankList.length === 0) return;

    const getSortedApis = () =>
      [...apiRankList]
        .sort((a, b) => b.cnt - a.cnt)
        .slice(0, 5)
        .map((api) => upperCase(api.method) + ':' + api.apiUrl);

    const chartConfigs = [
      {
        selected: tempSelectedOptions,
        setSelected: setSelectedOptions,
        setTempSelected: setTempSelectedOptions,
      },
      {
        selected: barChartTempSelected,
        setSelected: setBarChartSelected,
        setTempSelected: setBarChartTempSelected,
      },
      {
        selected: scatterChartTempSelected,
        setSelected: setScatterChartSelected,
        setTempSelected: setScatterChartTempSelected,
      },
    ];

    chartConfigs.forEach(({ selected, setSelected, setTempSelected }) => {
      if (selected.length > 0) {
        const validSelectedOptions = selected.filter((option) => {
          const [method, apiUrl] = option.split(':');
          return apiRankList.some(
            (api) =>
              api.method === method.toLowerCase() && api.apiUrl === apiUrl,
          );
        });

        if (validSelectedOptions.length > 0) {
          setSelected(validSelectedOptions);
          setTempSelected(validSelectedOptions);
        } else {
          const sortedApis = getSortedApis();
          setSelected(sortedApis);
          setTempSelected(sortedApis);
        }
      } else {
        const sortedApis = getSortedApis();
        setSelected(sortedApis);
        setTempSelected(sortedApis);
      }
    });
  }, [
    lineChartDateRange,
    barChartDateRange,
    scatterChartDateRange,
    svcType,
    apiRankList,
  ]);

  // 차트 타입에 따른 dateRange
  const dateRangeByChartType = useMemo(
    () =>
      selectedChartType === 'callCnt'
        ? lineChartDateRange
        : selectedChartType === 'errorCnt'
          ? barChartDateRange
          : selectedChartType === 'respCnt'
            ? scatterChartDateRange
            : lineChartDateRange,
    [
      selectedChartType,
      lineChartDateRange,
      barChartDateRange,
      scatterChartDateRange,
    ],
  );

  // 차트 타입에 따른 조회할 API Url 목록
  const apiUrlListByChartType = useMemo(
    () =>
      selectedChartType === 'callCnt'
        ? selectedOptions
        : selectedChartType === 'errorCnt'
          ? barChartSelected
          : selectedChartType === 'respCnt'
            ? scatterChartSelected
            : selectedOptions,
    [
      selectedChartType,
      selectedOptions,
      barChartSelected,
      scatterChartSelected,
    ],
  );

  // 날짜 변경 시 API 호출
  useEffect(() => {
    if (!svcType) return;

    if (dateRangeByChartType.startDate && dateRangeByChartType.endDate) {
      const callParams = {
        startDate: dateRangeByChartType.startDate,
        endDate: dateRangeByChartType.endDate,
        svcType,
        svcId,
        ...(selectedKeyId && { keyId: selectedKeyId }),
      };

      if (shouldMakeApiCall(callParams)) {
        dispatch(fetchApiRankList(callParams));
      }
    }
  }, [dispatch, svcType, svcId, selectedKeyId, dateRangeByChartType]);

  // 선택된 API 목록에 따른 차트 데이터 호출
  useEffect(() => {
    if (!svcType) return;

    if (dateRangeByChartType.startDate && dateRangeByChartType.endDate) {
      const callParams = {
        startDate: dateRangeByChartType.startDate,
        endDate: dateRangeByChartType.endDate,
        svcType,
        svcId,
        ...(selectedKeyId && { keyId: selectedKeyId }),
        apiUrl: apiUrlListByChartType,
      };

      if (shouldMakeApiCall(callParams)) {
        if (selectedChartType === 'callCnt') {
          dispatch(fetchApiCallList(callParams));
        } else if (selectedChartType === 'errorCnt') {
          dispatch(fetchApiErrorList(callParams));
        } else if (selectedChartType === 'respCnt') {
          dispatch(fetchApiResultList(callParams));
        }

        dispatch(fetchResponseCode(callParams));
        dispatch(fetchApiTot(callParams));
      }
    }
  }, [
    dispatch,
    selectedKeyId,
    svcType,
    svcId,
    dateRangeByChartType,
    apiUrlListByChartType,
    selectedChartType,
  ]);

  // pageNum 초기화
  useEffect(() => {
    setPageNum(1);
  }, [
    pageSize,
    tableSorter,
    tableFilter,
    dateRangeByChartType,
    apiUrlListByChartType,
  ]);

  // 하단 테이블 데이터 조회
  useEffect(() => {
    if (!svcType) return;

    if (dateRangeByChartType.startDate && dateRangeByChartType.endDate) {
      const callParams = {
        startDate: dateRangeByChartType.startDate,
        endDate: dateRangeByChartType.endDate,
        svcType,
        svcId,
        ...(selectedKeyId && { keyId: selectedKeyId }),
        responseCode: tableFilter?.responseCode,
        sort: tableSorter.sort,
        sortField: tableSorter.sortField,
        pageNum,
        pageSize,
        apiUrl: apiUrlListByChartType,
      };

      if (apiUrlListByChartType?.length > 0) {
        dispatch(fetchApiRes(callParams));
      }
    }
  }, [
    dispatch,
    selectedKeyId,
    svcType,
    svcId,
    dateRangeByChartType,
    apiUrlListByChartType,
    tableFilter,
    tableSorter,
    pageNum,
    pageSize,
  ]);

  // customSelect
  const toggleDropdown = () => {
    if (isDropdownOpen) {
      setSearchTerm('');
    }
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenKeyPopup = () => {
    setOpenKeyPopup(true);
  };

  const handleChange = (selectedValues) => {
    if (selectedValues.length > 5) {
      setIsModalOpen(true);
      setConfirmMessage(intlObj.get(message['store.warning.maxSelectIs5']));
      setTempSelectedOptions(selectedValues.slice(0, 5));
    } else {
      setTempSelectedOptions(selectedValues);
    }
  };

  const handleCancel = () => {
    setTempSelectedOptions(selectedOptions);
    setIsModalOpen(false);
    toggleDropdown();
  };

  const handleChartTypeChange = (selectedValue) => {
    setSelectedChartType(selectedValue);
  };

  const handleSelectKeyChange = (selectedValue) => {
    if (selectedValue === 'allSelect') {
      setApiInfo((prev) => ({
        ...prev,
        selectedKeyId: null,
        selectedKeyName: '',
      }));
      return;
    }

    const selectedData = keyList.find((key) => key.keyId === selectedValue);
    if (!selectedData) return;

    setApiInfo((prev) => ({
      ...prev,
      selectedKeyId: selectedData.keyId,
      selectedKeyName: selectedData.keyName,
    }));
  };

  const handleConfirm = () => {
    if (tempSelectedOptions.length === 0) {
      setIsModalOpen(true);
      setConfirmMessage(
        intlObj.get(message['store.validation.selectAtLeastOne']),
      );
      return;
    }

    setSelectedOptions(tempSelectedOptions);
    toggleDropdown();
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;
      setLineChartDateRange({
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      });
    }
  };

  // BarChart용
  const toggleBarChartDropdown = () => {
    if (isBarChartDropdownOpen) {
      setBarChartSearchTerm('');
    }
    setIsBarChartDropdownOpen((prev) => !prev);
  };

  const handleBarChartSearchChange = (event) => {
    setBarChartSearchTerm(event.target.value);
  };

  const handleBarChartChange = (selectedValues) => {
    if (selectedValues.length > 5) {
      setIsBarChartModalOpen(true);
      setBarChartConfirmMessage(
        intlObj.get(message['store.warning.maxSelectIs5']),
      );
      setBarChartTempSelected(selectedValues.slice(0, 5));
    } else {
      setBarChartTempSelected(selectedValues);
    }
  };

  const handleBarChartConfirm = () => {
    if (barChartTempSelected.length === 0) {
      setIsBarChartModalOpen(true);
      setBarChartConfirmMessage(
        intlObj.get(message['store.validation.selectAtLeastOne']),
      );
      return;
    }

    setBarChartSelected(barChartTempSelected);
    toggleBarChartDropdown();
  };

  const handleBarChartCancel = () => {
    setBarChartTempSelected(barChartSelected);
    setIsBarChartModalOpen(false);
    toggleBarChartDropdown();
  };

  const handleBarChartDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;
      setBarChartDateRange({
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      });
    }
  };

  const handleBarChartCallTopBtnClick = () => {
    const sortedApis = [...apiRankList]
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5);

    const topApiValues = sortedApis.map(
      (api) => `${upperCase(api.method) || ''}:${api.apiUrl}`,
    );

    setBarChartSelected(topApiValues);
    setBarChartTempSelected(topApiValues);
    toggleBarChartDropdown();
  };

  // Scatter Chart용
  const handleScatterChartCallTopBtnClick = () => {
    const sortedApis = [...apiRankList]
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5);

    const topApiValues = sortedApis.map(
      (api) => `${upperCase(api.method) || ''}:${api.apiUrl}`,
    );

    setScatterChartSelected(topApiValues);
    setScatterChartTempSelected(topApiValues);
    toggleScatterChartDropdown();
  };

  const handleScatterChartChange = (selectedValues) => {
    if (selectedValues.length > 5) {
      setIsModalOpen(true);
      setConfirmMessage(intlObj.get(message['store.warning.maxSelectIs5']));
      setScatterChartTempSelected(selectedValues.slice(0, 5));
    } else {
      setScatterChartTempSelected(selectedValues);
    }
  };

  const handleScatterChartConfirm = () => {
    if (scatterChartTempSelected.length === 0) {
      setIsModalOpen(true);
      setConfirmMessage(
        intlObj.get(message['store.validation.selectAtLeastOne']),
      );
      return;
    }

    setScatterChartSelected([...scatterChartTempSelected]);
    toggleScatterChartDropdown();
  };

  const handleScatterChartCancel = () => {
    setScatterChartTempSelected(scatterChartSelected);
    setIsModalOpen(false);
    toggleScatterChartDropdown();
  };

  const handleScatterChartSearchChange = (e) => {
    setScatterChartSearchTerm(e.target.value);
  };

  const handleScatterChartDateChange = (dates) => {
    if (!dates || dates.length !== 2) return;

    const [startDate, endDate] = dates;
    setScatterChartDateRange({
      startDate: dayjs(startDate).format('YYYY-MM-DD'),
      endDate: dayjs(endDate).format('YYYY-MM-DD'),
    });
  };

  // 테이블 필터 조건 변경
  const handleChangeTableFilter = (filters, action) => {
    if (action.action === 'filter') {
      setTableFilter(filters);
    }
  };

  // 테이블 정렬 변경
  const handleChangeTableSoter = (sorter, action) => {
    if (action.action === 'sort') {
      setTableSorter({
        sort:
          sorter.order === 'ascend'
            ? 'ASC'
            : sorter.order === 'descend'
              ? 'DESC'
              : null,
        sortField: sorter.order ? sorter.column.key : null,
      });
    }
  };

  // 대시보드 동적 설정
  const getDashboardData = () => {
    switch (selectedChartType) {
      case 'callCnt':
      case 'errorCnt':
      case 'respCnt':
        return {
          userCnt: dashState.userCnt || 0,
          callCnt: dashState.callCnt || 0,
          avgTime: dashState.avgTime || 0,
          errorCnt: dashState.errorCnt || 0,
        };
      default:
        return {
          userCnt: 0,
          callCnt: 0,
          avgTime: 0,
          errorCnt: 0,
        };
    }
  };

  const dashboardData = getDashboardData();

  // 테이블 동적 설정
  const getTableData = () => {
    switch (selectedChartType) {
      case 'callCnt':
      case 'errorCnt':
      case 'respCnt':
        return apiRes;
      default:
        return [];
    }
  };

  const tableData = getTableData();

  const tableColumn = [
    {
      title: intlObj.get(message['store.project']),
      dataIndex: 'prjId',
      width: '15%',
      resize: true,
      align: 'center',
      ellipsis: true,
    },
    {
      title: intlObj.get(message['store.apiReqTime']),
      key: 'timestamp',
      dataIndex: 'timestamp',
      width: '15%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: true,
      sortDirections: ['ascend', 'descend', null],
      render: (text) => {
        if (!text) return '-';

        const date = new Date(text);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
    },
    {
      title: intlObj.get(message['store.keyName']),
      dataIndex: 'keyName',
      width: '13%',
      resize: true,
      align: 'center',
      ellipsis: true,
    },
    {
      title: intlObj.get(message['store.keyType']),
      dataIndex: 'authCd',
      width: '7%',
      resize: true,
      align: 'center',
      ellipsis: true,
      render: (_, record) => {
        if (record?.authCd === 'SYS') {
          return intlObj.get(message['store.system']);
        }
        if (record?.authCd === 'PSN') {
          return intlObj.get(message['store.personal']);
        }
        return undefined;
      },
    },
    {
      title: intlObj.get(message['store.keyConnectionInfo']),
      width: '11%',
      resize: true,
      align: 'center',
      ellipsis: true,
      render: (_, record) => {
        const keyOwnerName = record?.keyOwnerName;
        const keyOwnerId = record?.keyOwnerId;
        const systemName = record?.appNm;

        return record?.authCd === 'PSN'
          ? `${keyOwnerName} (${keyOwnerId})`
          : record?.authCd === 'SYS'
            ? systemName
            : '-';
      },
    },
    {
      title: intlObj.get(message['store.statusCode']),
      dataIndex: 'responseCode',
      width: '10%',
      resize: true,
      align: 'center',
      ellipsis: true,
      render: (text) => text || '-',
      filters: [...responseCode]
        .sort((a, b) => a - b)
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
      sortDirections: ['ascend', 'descend', null],
      render: (text, record) => `(${record.method}) ${text}`,
    },
    {
      title: intlObj.get(message['store.responseTime']),
      key: 'responseTime',
      dataIndex: 'responseTime',
      width: '7%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: true,
      sortDirections: ['ascend', 'descend', null],
      render: (text) => (text ? `${formatNumberWithComma(text)} ms` : '-'),
    },
  ];

  // 모달에서 선택된 키를 부모 컴포넌트로 전달
  const handleKeySelect = (selectedData) => {
    if (selectedData) {
      setApiInfo((prev) => ({
        ...prev,
        selectedKeyId: selectedData.keyId,
        selectedKeyName: selectedData.keyName,
      }));
    }
    setOpenKeyPopup(false);
  };

  const handleCallTopBtnClick = () => {
    const sortedApis = [...apiRankList]
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5);

    const topApiValues = sortedApis.map(
      (api) => `${upperCase(api.method) || ''}:${api.apiUrl}`,
    );

    setSelectedOptions(topApiValues);
    setTempSelectedOptions(topApiValues);
    toggleDropdown();
  };

  const getOptionsForChartType = () => {
    if (!apiRankList || apiRankList.length === 0) {
      return [];
    }

    switch (selectedChartType) {
      case 'callCnt':
      case 'errorCnt':
      case 'respCnt':
        return apiRankList.map((api) => ({
          value: `${upperCase(api.method) || ''}:${api.apiUrl}`,
          label: `(${upperCase(api.method) || ''}) ${api.apiUrl}`,
        }));
      default:
        return [];
    }
  };

  return (
    <>
      <Division flex={true} gap={10}>
        <Select
          width={150}
          placeholder={intlObj.get(message['store.callCount'])}
          defaultValue={'callCnt'}
          options={firstOptions}
          onChange={handleChartTypeChange}
        />

        {selectedChartType === 'callCnt' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CustomSelect
              placeholder={'API Call best top 5'}
              options={getOptionsForChartType()}
              value={tempSelectedOptions}
              onChange={handleChange}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              isOpen={isDropdownOpen}
              toggleDropdown={toggleDropdown}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              handleCallTopBtnClick={handleCallTopBtnClick}
            />
          </div>
        )}

        {selectedChartType === 'errorCnt' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CustomSelect
              placeholder={'API Call best top 5'}
              options={getOptionsForChartType()}
              value={barChartTempSelected}
              onChange={handleBarChartChange}
              onConfirm={handleBarChartConfirm}
              onCancel={handleBarChartCancel}
              isOpen={isBarChartDropdownOpen}
              toggleDropdown={toggleBarChartDropdown}
              searchTerm={barChartSearchTerm}
              handleSearchChange={handleBarChartSearchChange}
              handleCallTopBtnClick={handleBarChartCallTopBtnClick}
            />
          </div>
        )}

        {selectedChartType === 'respCnt' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CustomSelect
              placeholder={'API Call best top 5'}
              options={getOptionsForChartType()}
              value={scatterChartTempSelected}
              onChange={handleScatterChartChange}
              onConfirm={handleScatterChartConfirm}
              onCancel={handleScatterChartCancel}
              isOpen={isScatterChartDropdownOpen}
              toggleDropdown={toggleScatterChartDropdown}
              searchTerm={scatterChartSearchTerm}
              handleSearchChange={handleScatterChartSearchChange}
              handleCallTopBtnClick={handleScatterChartCallTopBtnClick}
            />
          </div>
        )}

        {selectedChartType === 'callCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(lineChartDateRange.startDate),
              dayjs(lineChartDateRange.endDate),
            ]}
            onChange={handleDateChange}
            allowClear={false}
          />
        )}

        {selectedChartType === 'errorCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(barChartDateRange.startDate),
              dayjs(barChartDateRange.endDate),
            ]}
            onChange={handleBarChartDateChange}
            allowClear={false}
          />
        )}

        {selectedChartType === 'respCnt' && (
          <DatePicker.PresetRangePicker
            value={[
              dayjs(scatterChartDateRange.startDate),
              dayjs(scatterChartDateRange.endDate),
            ]}
            onChange={handleScatterChartDateChange}
            allowClear={false}
          />
        )}

        {isRegMode ? (
          <span>
            <Select
              onClick={axiosGetApiKey}
              placeholder={intlObj.get(message['store.selectKey'])}
              width={150}
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
      </Division>

      <div style={{ marginBottom: '20px' }}>
        {selectedChartType === 'callCnt' ? (
          <LineChart
            startDate={lineChartDateRange.startDate}
            endDate={lineChartDateRange.endDate}
            apiUrl={selectedOptions}
          />
        ) : selectedChartType === 'errorCnt' ? (
          <BarChart
            startDate={barChartDateRange.startDate}
            endDate={barChartDateRange.endDate}
            apiUrl={barChartSelected}
          />
        ) : (
          <ScatterChart
            startDate={scatterChartDateRange.startDate}
            endDate={scatterChartDateRange.endDate}
            apiUrl={scatterChartSelected}
          />
        )}
      </div>

      <Spin spinning={dashLoading}>
        <Division flex={true} gap={30}>
          <Dashboard
            iconSrc={icon_person}
            color={'#E7E8F8'}
            title={intlObj.get(message['store.userCount'])}
            count={formatNumberWithComma(dashboardData.userCnt)}
            className={'dash'}
            dashNumColor={'#333333'}
          />
          <Dashboard
            iconSrc={icon_cpm_api}
            color={'#F1F7FF'}
            title={intlObj.get(message['store.apiCallCount'])}
            count={formatNumberWithComma(dashboardData.callCnt)}
            className={'dash'}
            dashNumColor={'#333333'}
          />
          <Dashboard
            iconSrc={icon_time}
            color={'#F1F7FF'}
            title={intlObj.get(message['store.averageResponseTime'])}
            count={formatNumberWithComma(dashboardData.avgTime)}
            unit={dashboardData.avgTime !== 0 ? 'ms' : undefined}
            className={'dash'}
            dashNumColor={'#333333'}
          />
          <Dashboard
            iconSrc={icon_error}
            color={'#FFF5F5'}
            title={intlObj.get(message['store.errorCount'])}
            count={formatNumberWithComma(dashboardData.errorCnt)}
            className={'dash'}
            dashNumColor={'#FF0016'}
          />
        </Division>
      </Spin>

      <Division mt={40}>
        <Table
          loading={fetchApiResListLoading}
          columns={tableColumn}
          dataSource={tableData}
          type={'normal'}
          pagination={{
            position: ['bottomCenter'],
            showAllItems: true,
            total,
            pageSize,
            current: pageNum,
            onChange: (nextPageNum) => setPageNum(nextPageNum),
          }}
          paginationExtraContent={
            <Select
              value={pageSize}
              options={pageSizeOptions}
              onSelect={(_, value) => setPageSize(value.value)}
            />
          }
          onChange={(pagination, filters, sorter, action) => {
            handleChangeTableFilter(filters, action);
            handleChangeTableSoter(sorter, action);
          }}
          scroll={{ y: 500 }}
        />
      </Division>

      <Confirm
        open={isModalOpen}
        title={intlObj.get(message['store.alert'])}
        desc={confirmMessage}
        okText={intlObj.get(message['store.ok'])}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        hideCancel={true}
      />

      {selectedChartType === 'errorCnt' && (
        <Confirm
          open={isBarChartModalOpen}
          title={intlObj.get(message['store.alert'])}
          desc={barChartConfirmMessage}
          okText={intlObj.get(message['store.ok'])}
          onOk={() => setIsBarChartModalOpen(false)}
          onCancel={() => setIsBarChartModalOpen(false)}
          hideCancel={true}
        />
      )}

      <DashKeyModal
        open={openKeyPopup}
        onOk={handleKeySelect}
        onCancel={() => setOpenKeyPopup(false)}
        value={selectedKey}
        svcId={svcId}
        keyId={selectedKeyId}
      />
    </>
  );
};

export default ApiMonitoring;