import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: {
    //탭
    activeTab: 'myApiMgmt', //admin, subApi, myApiMgmt
    adminList: [],
    fetchAdminListLoading: false,
    //구독 중인 api
    mySubscribeList: [],
    fetchMySubscribeListLoading: false,
    //내가 등록한 api
    myRegistList: [],
    fetchMyRegistListLoading: false,
  },
  chart: {
    serviceDetail: {},
    fetchServiceDetailLoading: false,
    rank: {
      apiRankList: [],
      fetchApiRankListLoading: false,
    },
    callCnt: {
      //호출수
      apiCallList: [],
      fetchApiCallListLoading: false,
    },
    errorCnt: {
      //에러수
      apiErrorList: {},
      fetchApiErrorListLoading: false,
    },
    respRate: {
      //응답 시간
      apiResultList: {},
      fetchApiResultLoading: false,
    },
  },
  dash: {
    apiTot: {},
    fetchApiTotLoading: false,
  },
  table: {
    apiRes: [],
    responseCode: [],
    total: 0,
    fetchApiResListLoading: false,
  },
};

const dtlDashSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    initState: () => {
      return initialState;
    },
    setTabKey: (state, action) => {
      state.activeTab = action.payload;
    },
    //메인 리스트
    fetchAdminList: (state) => {
      state.list.fetchAdminListLoading = true;
    },
    fetchAdminListSuccess: (state, action) => {
      state.list.fetchAdminListLoading = false;
      state.list.adminList = action?.payload || [];
    },
    //구독 중인 api
    fetchMySubscribeList: (state) => {
      state.list.fetchMySubscribeListLoading = true;
    },
    fetchMySubscribeListSuccess: (state, action) => {
      state.list.fetchMySubscribeListLoading = false;
      state.list.mySubscribeList = action?.payload || [];
    },
    //내가 등록한 api
    fetchMyRegistList: (state) => {
      state.list.fetchMyRegistListLoading = true;
    },
    fetchMyRegistListSuccess: (state, action) => {
      state.list.fetchMyRegistListLoading = false;
      state.list.myRegistList = action?.payload || [];
    },
    //tab 구분
    fetchServiceDetail: (state) => {
      state.chart.fetchServiceDetailLoading = true;
    },
    fetchServiceDetailSuccess: (state, action) => {
      state.chart.fetchServiceDetailLoading = false;
      state.chart.serviceDetail = action?.payload || {};
    },
    //순위
    fetchApiRankList: (state) => {
      state.chart.rank.fetchApiRankListLoading = false;
    },
    fetchApiRankListSuccess: (state, action) => {
      state.chart.rank.fetchApiRankListLoading = true;
      state.chart.rank.apiRankList = action?.payload || [];
    },
    //api 요청건수
    fetchApiCallList: (state) => {
      state.chart.callCnt.fetchApiCallListLoading = true;
    },
    fetchApiCallListSuccess: (state, action) => {
      state.chart.callCnt.fetchApiCallListLoading = false;
      state.chart.callCnt.apiCallList = action?.payload || [];
    },
    //에러 수
    fetchApiErrorList: (state) => {
      state.chart.errorCnt.fetchApiErrorListLoading = true;
    },
    fetchApiErrorListSuccess: (state, action) => {
      state.chart.errorCnt.fetchApiErrorListLoading = false;
      state.chart.errorCnt.apiErrorList = action?.payload || {};
    },
    //응답 시간
    fetchApiResultList: (state) => {
      state.chart.respRate.fetchApiResultLoading = true;
    },
    fetchApiResultListSuccess: (state, action) => {
      state.chart.respRate.fetchApiResultLoading = false;
      state.chart.respRate.apiResultList = action?.payload || {};
    },
    //api call count(dashboard)
    fetchApiTot: (state) => {
      state.dash.fetchApiTotLoading = true;
    },
    fetchApiTotSuccess: (state, action) => {
      state.dash.fetchApiTotLoading = false;
      state.dash.apiTot = action?.payload || {};
    },
    //테이블(api 호출 현황)
    fetchApiRes: (state) => {
      state.table.fetchApiResListLoading = true;
    },
    fetchApiResSuccess: (state, action) => {
      state.table.fetchApiResListLoading = false;
      state.table.apiRes = action?.payload?.apiRes || [];
      state.table.total = action?.payload?.total || 0;
    },
    // API 모니터링 테이블 테이블 responseCode 목록 (상태값 필터 목록)
    fetchResponseCode: (state) => {
      state.table.fetchApiResListLoading = true;
    },
    fetchResponseCodeSuccess: (state, action) => {
      state.table.responseCode = action?.payload || [];
    },
  },
});

export const {
  initState,
  setTabKey,
  fetchAdminList,
  fetchAdminListSuccess,
  fetchMySubscribeList,
  fetchMySubscribeListSuccess,
  fetchMyRegistList,
  fetchMyRegistListSuccess,
  fetchApiRankList,
  fetchApiRankListSuccess,
  fetchApiCallList,
  fetchApiCallListSuccess,
  fetchApiErrorList,
  fetchApiErrorListSuccess,
  fetchApiResultList,
  fetchApiResultListSuccess,
  fetchServiceDetail,
  fetchServiceDetailSuccess,
  fetchApiTot,
  fetchApiTotSuccess,
  fetchApiRes,
  fetchApiResSuccess,
  fetchResponseCode,
  fetchResponseCodeSuccess,
} = dtlDashSlice.actions;
export default dtlDashSlice.reducer;
import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchAdminList,
  fetchAdminListSuccess,
  fetchMySubscribeList,
  fetchMySubscribeListSuccess,
  fetchMyRegistList,
  fetchMyRegistListSuccess,
  fetchServiceDetail,
  fetchServiceDetailSuccess,
  fetchApiRankList,
  fetchApiRankListSuccess,
  fetchApiCallList,
  fetchApiCallListSuccess,
  fetchApiErrorList,
  fetchApiErrorListSuccess,
  fetchApiResultList,
  fetchApiResultListSuccess,
  fetchApiTot,
  fetchApiTotSuccess,
  fetchApiRes,
  fetchApiResSuccess,
  fetchResponseCode,
  fetchResponseCodeSuccess,
} from './reducer';
import axios from 'axios';

//전체 api (관리자)
const axiosAdminList = async (search) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/admin/getSubApi`,
    {},
    { params: { keyword: search, order: 'DESC', sortBy: 'upd_dttm' } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//구독 중인 API
const axiosGetMySubscribeList = async (search) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/myPage/getMySubApi`,
    {},
    { params: { search, keyword: 'NOR', order: 'DESC', sortBy: 'upd_dttm' } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//내가 등록한 API
const axiosGetMyRegistList = async (search) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/myPage/getMyRegistApi`,
    {},
    { params: { search, order: 'DESC', sortBy: 'upd_dttm' } },
  );

  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//api, llm, cts 구분
const axiosGetServiceDetail = async (svcId, svcType) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/dtl`,
    { params: { svcId, svcType } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//api 요청건수 순위
const axiosGetApiRank = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiRankCall`,
    {
      params: {
        startDate,
        endDate,
        svcType,
        svcId,
        keyId,
        apiUrl,
      },
    },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//api 요청건수
const axiosGetApiChartData = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiChartData`,
    {
      params: {
        startDate,
        endDate,
        svcType,
        svcId,
        keyId,
        apiUrl,
      },
    },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//에러수
const axiosGetApiError = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiErrorChart`,
    { params: { startDate, endDate, svcType, svcId, keyId, apiUrl } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//응답 시간
const axiosGetApiResult = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiResTimeChart`,
    { params: { startDate, endDate, svcType, svcId, keyId, apiUrl } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//dashboard
const axiosGetApiTot = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiTot`,
    { params: { startDate, endDate, svcType, svcId, keyId, apiUrl } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//테이블 api 호출현황
const axiosGetApiDetailList = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  responseCode,
  sort,
  sortField,
  pageNum,
  pageSize,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiDetailList`,
    {
      params: {
        startDate,
        endDate,
        svcType,
        svcId,
        keyId,
        responseCode,
        sort,
        sortField,
        pageNum,
        pageSize,
        apiUrl,
      },
    },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// API 모니터링 테이블 테이블 responseCode 목록 (상태값 필터 목록) 조회
const axiosGetApiDetailsFilters = async (
  startDate,
  endDate,
  svcType,
  svcId,
  keyId,
  apiUrl,
) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiDetailListFilters`,
    {
      params: {
        startDate,
        endDate,
        svcType,
        svcId,
        keyId,
        apiUrl,
      },
    },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

//전체 api (관리자)
function* getAdminListSaga(action) {
  try {
    const search = action?.payload?.search;
    const response = yield call(axiosAdminList, search);
    const registList = response?.data?.response?.svcList || [];

    yield put(fetchAdminListSuccess(registList));
  } catch (error) {
    console.log(error);
  }
}

//구독 중인 API
function* getMySubscribeListSaga(action) {
  try {
    const search = action?.payload?.search;
    const response = yield call(axiosGetMySubscribeList, search);
    const serviceList = response?.data?.response?.svcList || [];
    yield put(fetchMySubscribeListSuccess(serviceList));
  } catch (error) {
    console.log(error);
  }
}

//내가 등록한 API
function* getMyRegistListSaga(action) {
  try {
    const search = action?.payload?.search;
    const response = yield call(axiosGetMyRegistList, search);
    const registList = response?.data?.response?.svcList || [];
    yield put(fetchMyRegistListSuccess(registList));
  } catch (error) {
    console.log(error);
  }
}

// api, llm, cts 구분
function* getServiceDetailSaga(action) {
  try {
    const svcId = action?.payload?.svcId;
    const svcType = action?.payload?.svcType;
    const detailResponse = yield call(axiosGetServiceDetail, svcId, svcType);
    const serviceDetail = detailResponse?.data?.response || {};
    yield put(fetchServiceDetailSuccess(serviceDetail));
  } catch (error) {
    console.log(error);
  }
}

//api 요청건수 순위
function* getApiRankSaga(action) {
  try {
    const { startDate, endDate, svcType, svcId, keyId, apiUrl } =
      action.payload;
    const response = yield call(
      axiosGetApiRank,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      apiUrl,
    );
    const rankList = response?.data?.response?.body?.response || [];
    yield put(fetchApiRankListSuccess(rankList));
  } catch (error) {
    console.log(error);
  }
}

//api 요청건수
function* getApiCallSaga(action) {
  try {
    const { startDate, endDate, svcType, svcId, keyId, apiUrl } =
      action.payload;
    const response = yield call(
      axiosGetApiChartData,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      apiUrl,
    );
    const callList = response?.data?.response || [];
    yield put(fetchApiCallListSuccess(callList));
  } catch (error) {
    console.log(error);
  }
}

//에러수
function* getApiErrorSage(action) {
  try {
    const { startDate, endDate, svcType, svcId, keyId, apiUrl } =
      action.payload;
    const response = yield call(
      axiosGetApiError,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      apiUrl,
    );
    const errorList = response?.data?.response || {};
    yield put(fetchApiErrorListSuccess(errorList));
  } catch (error) {
    console.log(error);
  }
}

//응답 시간
function* getApiResultSaga(action) {
  try {
    const { startDate, endDate, svcType, svcId, keyId, apiUrl } =
      action.payload;
    const response = yield call(
      axiosGetApiResult,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      apiUrl,
    );
    const resultList = response?.data?.response || {};
    yield put(fetchApiResultListSuccess(resultList));
  } catch (error) {
    console.log(error);
  }
}

//dashboard
function* getApiTotSaga(action) {
  try {
    const { startDate, endDate, svcType, svcId, keyId, apiUrl } =
      action.payload;
    const response = yield call(
      axiosGetApiTot,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      apiUrl,
    );
    const apiTot = response?.data?.response?.body?.response || {};
    yield put(fetchApiTotSuccess(apiTot));
  } catch (error) {
    console.log(error);
  }
}

//테이블
function* getApiResSaga(action) {
  try {
    const {
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      responseCode,
      sort,
      sortField,
      pageNum,
      pageSize,
      apiUrl,
    } = action.payload;
    const response = yield call(
      axiosGetApiDetailList,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      responseCode,
      sort,
      sortField,
      pageNum,
      pageSize,
      apiUrl,
    );
    const resData = response?.data?.response;
    const apiRes = resData?.svcList || [];
    const total = resData?.total || 0;

    yield put(fetchApiResSuccess({ apiRes, total }));
  } catch (error) {
    console.log(error);
  }
}

// API 모니터링 테이블 테이블 responseCode 목록 (상태값 필터 목록) 조회
function* getResponseCodeSaga(action) {
  try {
    const { startDate, endDate, svcType, svcId, keyId, apiUrl } =
      action.payload;
    const response = yield call(
      axiosGetApiDetailsFilters,
      startDate,
      endDate,
      svcType,
      svcId,
      keyId,
      apiUrl,
    );
    const resposeCodeList = response?.data?.response?.responseCodes || [];

    yield put(fetchResponseCodeSuccess(resposeCodeList));
  } catch (error) {
    console.log(error);
  }
}

export default function* dashboardSata() {
  yield takeLatest(fetchAdminList.type, getAdminListSaga);
  yield takeLatest(fetchMySubscribeList.type, getMySubscribeListSaga);
  yield takeLatest(fetchMyRegistList.type, getMyRegistListSaga);
  yield takeLatest(fetchServiceDetail.type, getServiceDetailSaga);
  yield takeLatest(fetchApiRankList.type, getApiRankSaga);
  yield takeLatest(fetchApiCallList.type, getApiCallSaga);
  yield takeLatest(fetchApiErrorList.type, getApiErrorSage);
  yield takeLatest(fetchApiResultList.type, getApiResultSaga);
  yield takeLatest(fetchApiTot.type, getApiTotSaga);
  yield takeLatest(fetchApiRes.type, getApiResSaga);
  yield takeLatest(fetchResponseCode.type, getResponseCodeSaga);
}


