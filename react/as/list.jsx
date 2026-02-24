import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  serviceList: [],
  fetchServiceListLoading: false,
  apiListByService: {},
  fetchApiListByServiceLoading: false,
  activeTabKey: 'list', //list or subApi or regApi
};

const listSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    initState: () => {
      return initialState;
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      set(state, field, value);
    },
    fetchServiceList: (state) => {
      state.fetchServiceListLoading = true;
    },
    fetchServiceListSuccess: (state, action) => {
      state.serviceList = action?.payload || [];
      state.fetchServiceListLoading = false;
    },
    fetchApiListByService: (state) => {
      state.fetchApiListByServiceLoading = true;
    },
    fetchApiListByServiceSuccess: (state, action) => {
      const { svcId, apiList } = action?.payload || {};
      state.apiListByService[svcId] = apiList;
      state.fetchApiListByServiceLoading = false;
    },
  },
});

export const {
  initState,
  updateField,
  fetchServiceList,
  fetchServiceListSuccess,
  fetchApiListByService,
  fetchApiListByServiceSuccess,
} = listSlice.actions;
export default listSlice.reducer;
import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchServiceList,
  fetchServiceListSuccess,
  fetchApiListByService,
  fetchApiListByServiceSuccess,
} from './reducer';
import axios from 'axios';

const axiosGetServiceList = async (keyword, sortBy, category, keyId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/service/list`,
    { params: { keyword, sortBy, category, keyId, order: 'desc' } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosGetApiList = async (svcId, keyId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/list`,
    { params: { svcId, keyId, sortBy: 'api_id', order: 'asc' } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

function* getServiceListSaga(action) {
  try {
    const { keyword, sortBy, category, keyId } = action?.payload;
    const response = yield call(
      axiosGetServiceList,
      keyword,
      sortBy,
      category,
      keyId,
    );
    const serviceList = (response?.data?.response || [])
      .filter((item) => item.subStatCd !== 'ERR')
      .map((item) => {
        const metaList = [
          //{ key: '등록자', value: item.regUserNameKor },
          { key: '수정일', value: item.updDttm.split(' ')[0] },
          { key: '조회수', value: item.vwCnt },
          { key: '구독수', value: item.subCount },
        ];
        return {
          svcId: item.svcId,
          catId: item.catId,
          category: item.catPath,
          title: item.svcNm,
          description: item.svcDesc,
          subStatCd: item.subStatCd,
          metaList: metaList,
          vwCnt: item.vwCnt,
          subCount: item.subCount,
          updDttm: item.updDttm.split(' ')[0],
          authYn: item.authYn,
          svcType: item.svcType,
          svcModel: item.svcModel,
        };
      });
    yield put(fetchServiceListSuccess(serviceList));
  } catch (error) {}
}

function* getApiListByServiceSaga(action) {
  try {
    const { svcId, keyId } = action?.payload;
    const response = yield call(axiosGetApiList, svcId, keyId);
    const apiList = (response?.data || [])
      .filter((api) => api.subStat !== 'ERR')
      .map((api) => ({
        ...api,
        isChecked: true,
      }));
    yield put(fetchApiListByServiceSuccess({ svcId, apiList }));
  } catch (error) {}
}

export default function* keySaga() {
  yield takeLatest(fetchServiceList.type, getServiceListSaga);
  yield takeLatest(fetchApiListByService.type, getApiListByServiceSaga);
}

