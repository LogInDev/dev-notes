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

const defaultTableSorter = {
  sort: null,
  sortField: null,
};

const defaultPageSize = 10;

const ApiMonitoring = () => {
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

  //차트
  const apiCallState = useSelector((state) => state.get('dashboard')) || {};
  const chartState = apiCallState?.chart || {};
  const [selectedChartType, setSelectedChartType] = useState('callCnt'); // 차트 유형 상태

  // 서비스 정보
  const dtlState = apiCallState?.chart?.serviceDetail || {};
  const svcType = dtlState?.svcType;

  //호출 랭크
  const apiRankList = chartState?.rank?.apiRankList || [];

  //라인차트용 상태
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

  // Scatter Chart 관련 상태 추가
  const [scatterChartSelected, setScatterChartSelected] = useState([]);
  const [scatterChartTempSelected, setScatterChartTempSelected] = useState([]);
  const [scatterChartSearchTerm, setScatterChartSearchTerm] = useState('');
  const [scatterChartDateRange, setScatterChartDateRange] = useState({
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [isScatterChartDropdownOpen, setIsScatterChartDropdownOpen] =
    useState(false);

  const toggleScatterChartDropdown = () => {
    setIsScatterChartDropdownOpen(!isScatterChartDropdownOpen);
  };

  //테이블
  const tableState = apiCallState?.table || {};
  const apiRes = tableState?.apiRes || [];
  const responseCode = tableState?.responseCode || [];
  const total = tableState?.total || [];
  const fetchApiResListLoading = tableState?.fetchApiResListLoading || false;
  const [tableFilter, setTableFilter] = useState({});
  const [tableSorter, setTableSorter] = useState(defaultTableSorter);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageNum, setPageNum] = useState(1);

  //대시보드
  const dashState = apiCallState?.dash?.apiTot || {};
  const dashLoading = apiCallState?.dash?.fetchApiTotLoading || false;

  //모달
  const [openKeyPopup, setOpenKeyPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBarChartModalOpen, setIsBarChartModalOpen] = useState(false);

  //confirm
  const [confirmMessage, setConfirmMessage] = useState('');
  const [barChartConfirmMessage, setBarChartConfirmMessage] = useState('');

  //local storage
  const [apiInfo, setApiInfo] = useState({});
  const { keyId, keyName } = apiInfo;

  //CustomSelectbox
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 키 관련
  const [keyList, setKeyList] = useState([]);
  const selectedKey = useMemo(
    () => keyList.find((key) => key.keyId === keyId),
    [keyList, keyId],
  );

  //검색
  const [searchTerm, setSearchTerm] = useState('');

  // key select 세팅
  const axiosGetApiKey = async () => {
    try {
      const response = await axios.get(
        `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiKeyList`,
        {
          params: {
            svcId,
          },
        },
      );
      if (!response.status || response.status < 200 || response.status >= 300)
        throw response;
      const transformedData = response.data.response.map((item) => ({
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
    }
  };

  useEffect(() => {
    setApiInfo(JSON.parse(localStorage.getItem('apiInfo')));
    axiosGetApiKey();
  }, []);

  // 중복 호출 방지를 위한 useRef와 상태 관리
  const previousApiCallParams = useRef(null);

  // API 호출을 위한 유틸리티 함수
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

    // 공통 로직: 상위 5 API 목록 생성
    const getSortedApis = () =>
      [...apiRankList]
        .sort((a, b) => b.cnt - a.cnt)
        .slice(0, 5)
        .map((api) => upperCase(api.method) + ':' + api.apiUrl);

    // 차트 타입별로 날짜 변경 시 처리
    const chartConfigs = [
      {
        type: 'callCnt',
        dateRange: lineChartDateRange,
        selected: tempSelectedOptions,
        setSelected: setSelectedOptions,
        tempSelected: setTempSelectedOptions,
      },
      {
        type: 'errorCnt',
        dateRange: barChartDateRange,
        selected: barChartTempSelected,
        setSelected: setBarChartSelected,
        tempSelected: setBarChartTempSelected,
      },
      {
        type: 'respCnt',
        dateRange: scatterChartDateRange,
        selected: scatterChartTempSelected,
        setSelected: setScatterChartSelected,
        tempSelected: setScatterChartTempSelected,
      },
    ];

    chartConfigs.forEach(
      ({ type, dateRange, selected, setSelected, tempSelected }) => {
        // 날짜 범위가 유효하지 않으면 건너뜀
        if (!dateRange.startDate || !dateRange.endDate) return;

        // 기존 선택된 API가 있는 경우 유지
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
            tempSelected(validSelectedOptions);
          } else {
            const sortedApis = getSortedApis();
            setSelected(sortedApis);
            tempSelected(sortedApis);
          }
        } else {
          const sortedApis = getSortedApis();
          setSelected(sortedApis);
          tempSelected(sortedApis);
        }
      },
    );
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

  // 날짜 변경 시 API 호출 (중복 방지)
  useEffect(() => {
    if (!svcType) return;

    // 날짜 범위가 유효한 경우에만 API 호출
    if (dateRangeByChartType.startDate && dateRangeByChartType.endDate) {
      const callParams = {
        startDate: dateRangeByChartType.startDate,
        endDate: dateRangeByChartType.endDate,
        svcType: svcType,
        svcId: svcId,
        ...(keyId && keyId !== 'REG' && { keyId }),
      };

      // 중복 호출 방지 체크
      if (shouldMakeApiCall(callParams)) {
        dispatch(fetchApiRankList(callParams));
      }
    }
  }, [svcType, svcId, keyId, dateRangeByChartType]);

  // 선택된 API 목록에 따른 차트 데이터 호출 (중복 방지)
  useEffect(() => {
    if (!svcType) return;

    // 날짜 범위가 유효한 경우에만 API 호출
    if (dateRangeByChartType.startDate && dateRangeByChartType.endDate) {
      const shouldIncludeKey = keyId && keyId !== 'REG';
      const callParams = {
        startDate: dateRangeByChartType.startDate,
        endDate: dateRangeByChartType.endDate,
        svcType: svcType,
        svcId: svcId,
        ...(shouldIncludeKey && { keyId }),
        apiUrl: apiUrlListByChartType,
      };

      // 중복 호출 방지 체크
      if (shouldMakeApiCall(callParams)) {
        if (selectedChartType === 'callCnt') {
          dispatch(
            fetchApiCallList({
              ...callParams,
              apiUrl: apiUrlListByChartType,
            }),
          );
        } else if (selectedChartType === 'errorCnt') {
          dispatch(
            fetchApiErrorList({
              ...callParams,
              apiUrl: apiUrlListByChartType,
            }),
          );
        } else if (selectedChartType === 'respCnt') {
          dispatch(
            fetchApiResultList({
              ...callParams,
              apiUrl: apiUrlListByChartType,
            }),
          );
        }

        dispatch(
          fetchResponseCode({
            ...callParams,
            apiUrl: apiUrlListByChartType,
          }),
        );
        dispatch(
          fetchApiTot({
            ...callParams,
            apiUrl: apiUrlListByChartType,
          }),
        );
      }
    }
  }, [
    dispatch,
    keyId,
    svcType,
    svcId,
    dateRangeByChartType,
    apiUrlListByChartType,
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

    // 날짜 범위가 유효한 경우에만 API 호출
    if (dateRangeByChartType.startDate && dateRangeByChartType.endDate) {
      const shouldIncludeKey = keyId && keyId !== 'REG';
      const callParams = {
        startDate: dateRangeByChartType.startDate,
        endDate: dateRangeByChartType.endDate,
        svcType: svcType,
        svcId: svcId,
        ...(shouldIncludeKey && { keyId }),
        responseCode: tableFilter?.responseCode,
        sort: tableSorter.sort,
        sortField: tableSorter.sortField,
        pageNum,
        pageSize,
        apiUrl: apiUrlListByChartType,
      };

      if (apiUrlListByChartType?.length > 0) {
        dispatch(
          fetchApiRes({
            ...callParams,
            apiUrl: apiUrlListByChartType,
          }),
        );
      }
    }
  }, [
    dispatch,
    keyId,
    svcType,
    svcId,
    dateRangeByChartType,
    apiUrlListByChartType,
    tableFilter,
    tableSorter,
    pageNum,
    pageSize,
  ]);

  //customSelect
  const toggleDropdown = () => {
    if (isDropdownOpen) {
      setSearchTerm('');
    }
    setIsDropdownOpen(!isDropdownOpen);
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
    setTempSelectedOptions(selectedOptions); // 선택을 취소한 경우 tempSelectedOptions을 이전 선택으로 재설정
    setIsModalOpen(false); // Confirm 창 닫기
    toggleDropdown(); // 드롭다운 닫기
  };

  const handleChartTypeChange = (selectedValue) => {
    setSelectedChartType(selectedValue);
  };

  const handleConfirm = () => {
    if (tempSelectedOptions.length === 0) {
      setIsModalOpen(true);
      setConfirmMessage(
        intlObj.get(message['store.validation.selectAtLeastOne']),
      );
      return;
    } else {
      setSelectedOptions(tempSelectedOptions);
      toggleDropdown(); // 드롭다운 닫기
    }
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

  // BarChart용 드롭다운 토글 함수
  const toggleBarChartDropdown = () => {
    if (isBarChartDropdownOpen) {
      setBarChartSearchTerm('');
    }
    setIsBarChartDropdownOpen(!isBarChartDropdownOpen);
  };

  // BarChart용 검색 변경 핸들러
  const handleBarChartSearchChange = (event) => {
    setBarChartSearchTerm(event.target.value);
  };
