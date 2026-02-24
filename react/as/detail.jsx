import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  permission: {
    subscriptionPermission: 'NON', // NOR: 권한 존재, APR: 권한 승인 대기, NON: 권한 없음
    fetchPermissionLoading: false,
    fetchPermissionSuccess: false,
  },
  detail: {
    serviceDetail: {},
    fetchServiceDetailLoading: false,
    fetchServiceDetailSuccess: false,
  },
  list: {
    apiList: [],
    checkedList: [],
    fetchApiListLoading: false,
    fetchApiListSuccess: false,
  },
  manager: {
    managerList: [],
    fetchManagerListLoading: false,
    fetchManagerListSuccess: false,
  },
  history: {
    historyList: [],
    fetchHistoryListLoading: false,
    fetchHistoryListSuccess: false,
    updateLoading: false,
    updateSuccess: false,
  },
  requestSubscriptionPermissionLoading: false,
  requestSubscriptionPermissionSuccess: false,
  requestSubscribeLoading: false,
  requestSubscribeSuccess: false,
  cancelSubscribeLoading: false,
  cancelSubscribeSuccess: false,
  reserveDeleteServiceLoading: false,
  reserveDeleteServiceSuccess: false,
  cancelDeleteReserveLoading: false,
  cancelDeleteReserveSuccess: false,
};

const detailSlice = createSlice({
  name: 'detail',
  initialState,
  reducers: {
    initState: () => {
      return initialState;
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      set(state, field, value);
    },
    increaseViewCount: () => {},
    fetchSubscriptionPermission: (state) => {
      state.permission.fetchPermissionLoading = true;
    },
    fetchSubscriptionPermissionSuccess: (state, action) => {
      state.permission.subscriptionPermission = action?.payload || 'NON';
      state.permission.fetchPermissionSuccess = true;
      state.permission.fetchPermissionLoading = false;
    },
    fetchSubscriptionPermissionFail: (state) => {
      state.permission.fetchPermissionLoading = false;
    },
    fetchServiceDetail: (state) => {
      state.detail.fetchServiceDetailLoading = true;
    },
    fetchServiceDetailSuccess: (state, action) => {
      state.detail.serviceDetail = action?.payload || {};
      state.detail.fetchServiceDetailSuccess = true;
      state.detail.fetchServiceDetailLoading = false;
    },
    fetchServiceDetailFail: (state) => {
      state.detail.fetchServiceDetailLoading = false;
    },
    fetchApiList: (state) => {
      state.list.fetchApiListLoading = true;
    },
    fetchApiListSuccess: (state, action) => {
      state.list.apiList = action?.payload?.apiList || [];
      state.list.checkedList = action?.payload?.checkedList || [];
      state.list.fetchApiListSuccess = true;
      state.list.fetchApiListLoading = false;
    },
    fetchApiListFail: (state) => {
      state.list.fetchApiListLoading = false;
    },
    fetchManagerList: (state) => {
      state.manager.fetchManagerListLoading = true;
    },
    fetchManagerListSuccess: (state, action) => {
      state.manager.managerList = action?.payload || [];
      state.manager.fetchManagerListSuccess = true;
      state.manager.fetchManagerListLoading = false;
    },
    fetchManagerListFail: (state) => {
      state.manager.fetchManagerListLoading = false;
    },
    fetchHistoryList: (state) => {
      state.history.fetchHistoryListLoading = true;
    },
    fetchHistoryListSuccess: (state, action) => {
      state.history.historyList = action?.payload || [];
      state.history.fetchHistoryListSuccess = true;
      state.history.fetchHistoryListLoading = false;
    },
    fetchHistoryListFail: (state) => {
      state.history.fetchHistoryListLoading = false;
    },
    updateHistory: (state) => {
      state.history.updateLoading = true;
      state.history.updateSuccess = false;
    },
    updateHistorySuccess: (state) => {
      state.history.updateLoading = false;
      state.history.updateSuccess = true;
    },
    updateHistoryFail: (state) => {
      state.history.updateLoading = false;
    },
    requestSubscriptionPermission: (state) => {
      state.requestSubscriptionPermissionLoading = true;
    },
    requestSubscriptionPermissionSuccess: (state) => {
      state.requestSubscriptionPermissionLoading = false;
      state.requestSubscriptionPermissionSuccess = true;
    },
    requestSubscriptionPermissionFail: (state) => {
      state.requestSubscriptionPermissionLoading = false;
    },
    requestSubscribe: (state) => {
      state.requestSubscribeLoading = true;
    },
    requestSubscribeSuccess: (state) => {
      state.requestSubscribeLoading = false;
      state.requestSubscribeSuccess = true;
    },
    requestSubscribeFail: (state) => {
      state.requestSubscribeLoading = false;
    },
    cancelSubscribe: (state) => {
      state.cancelSubscribeLoading = true;
    },
    cancelSubscribeSuccess: (state) => {
      state.cancelSubscribeLoading = false;
      state.cancelSubscribeSuccess = true;
    },
    cancelSubscribeFail: (state) => {
      state.cancelSubscribeLoading = false;
    },
    reserveDeleteService: (state) => {
      state.reserveDeleteServiceLoading = true;
    },
    reserveDeleteServiceSuccess: (state) => {
      state.reserveDeleteServiceLoading = false;
      state.reserveDeleteServiceSuccess = true;
    },
    reserveDeleteServiceFail: (state) => {
      state.reserveDeleteServiceLoading = false;
    },
    cancelDeleteReserve: (state) => {
      state.cancelDeleteReserveLoading = true;
    },
    cancelDeleteReserveSuccess: (state) => {
      state.cancelDeleteReserveLoading = false;
      state.cancelDeleteReserveSuccess = true;
    },
    cancelDeleteReserveFail: (state) => {
      state.cancelDeleteReserveLoading = false;
    },
  },
});

export const {
  initState,
  updateField,
  increaseViewCount,
  fetchSubscriptionPermission,
  fetchSubscriptionPermissionSuccess,
  fetchSubscriptionPermissionFail,
  fetchServiceDetail,
  fetchServiceDetailSuccess,
  fetchServiceDetailFail,
  fetchApiList,
  fetchManagerList,
  fetchManagerListSuccess,
  fetchManagerListFail,
  fetchApiListSuccess,
  fetchApiListFail,
  fetchHistoryList,
  fetchHistoryListSuccess,
  fetchHistoryListFail,
  updateHistory,
  updateHistorySuccess,
  updateHistoryFail,
  requestSubscriptionPermission,
  requestSubscriptionPermissionSuccess,
  requestSubscriptionPermissionFail,
  requestSubscribe,
  requestSubscribeSuccess,
  requestSubscribeFail,
  cancelSubscribe,
  cancelSubscribeSuccess,
  cancelSubscribeFail,
  reserveDeleteService,
  reserveDeleteServiceSuccess,
  reserveDeleteServiceFail,
  cancelDeleteReserve,
  cancelDeleteReserveSuccess,
  cancelDeleteReserveFail,
} = detailSlice.actions;
export default detailSlice.reducer;
import { call, put, takeLatest } from 'redux-saga/effects';
import {
  increaseViewCount,
  fetchSubscriptionPermission,
  fetchSubscriptionPermissionSuccess,
  fetchSubscriptionPermissionFail,
  fetchServiceDetail,
  fetchServiceDetailSuccess,
  fetchServiceDetailFail,
  fetchApiList,
  fetchApiListSuccess,
  fetchApiListFail,
  fetchManagerList,
  fetchManagerListSuccess,
  fetchManagerListFail,
  fetchHistoryList,
  fetchHistoryListSuccess,
  fetchHistoryListFail,
  updateHistory,
  updateHistorySuccess,
  updateHistoryFail,
  requestSubscriptionPermission,
  requestSubscriptionPermissionSuccess,
  requestSubscriptionPermissionFail,
  requestSubscribe,
  requestSubscribeSuccess,
  requestSubscribeFail,
  cancelSubscribe,
  cancelSubscribeSuccess,
  cancelSubscribeFail,
  reserveDeleteService,
  reserveDeleteServiceSuccess,
  reserveDeleteServiceFail,
  cancelDeleteReserve,
  cancelDeleteReserveSuccess,
  cancelDeleteReserveFail,
} from './reducer';
import axios from 'axios';

const axiosPutViewCount = async (svcId) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/vwCnt`,
    {},
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosGetServiceDetail = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/dtl`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosGetIsServiceDeleted = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/svcRes`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosGetDocumentList = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/btnList`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosGetSubscriptionPermission = async (svcId, keyId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/serReq`,
    { params: { svcId, keyId } },
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

const axiosGetManagerList = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/mngList`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosGetHistoryList = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/detail/getActHist`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosPutUpdateHistory = async (svcId, actId, memo) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/updateMemo`,
    { svcId, actId, memo },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosPostRequestSubscriptionPermission = async (body) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/svc/reqSub`,
    body,
  );

  return response;
};

const axiosPutUpdateSubscribe = async (body) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/myPage/modifySub`,
    body,
  );
  // if (!response.status || response.status < 200 || response.status >= 300)
  //   throw new Error(response);
  return response;
};

const axiosPutReserveDeleteService = async (svcId, resDate, subCount) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/resDelete`,
    {},
    { params: { svcId, resDate, subCount, delYn: 'Y' } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const axiosPutCancelDeleteReserve = async (svcId) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/resDelete`,
    {},
    { params: { svcId, delYn: 'N' } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

function* increaseViewCountSaga(action) {
  try {
    const svcId = action?.payload;
    yield call(axiosPutViewCount, svcId);
  } catch (error) {
    console.log(error);
  }
}

function* getSubscriptionPermissionSaga(action) {
  try {
    const { svcId, keyId } = action?.payload;
    if (keyId === undefined) {
      yield put(fetchSubscriptionPermissionSuccess('NOTKEY'));
    } else {
      const response = yield call(axiosGetSubscriptionPermission, svcId, keyId);
      const subscriptionPermission = response?.data?.response || 'NON';
      yield put(fetchSubscriptionPermissionSuccess(subscriptionPermission));
    }
  } catch (error) {
    yield put(fetchSubscriptionPermissionFail());
  }
}

function* getServiceDetailSaga(action) {
  try {
    const svcId = action?.payload?.svcId;
    const detailResponse = yield call(axiosGetServiceDetail, svcId);
    const serviceDetail = detailResponse?.data?.response || {};

    const deleteStatusResponse = yield call(axiosGetIsServiceDeleted, svcId);
    const isDeleted = deleteStatusResponse?.data?.response;
    serviceDetail.isDeleted = isDeleted;

    const documentResponse = yield call(axiosGetDocumentList, svcId);
    const documentList = documentResponse?.data?.response || [];
    serviceDetail.documentList = documentList;

    yield put(fetchServiceDetailSuccess(serviceDetail));
  } catch (error) {
    yield put(fetchServiceDetailFail());
  }
}

function* getApiListSaga(action) {
  try {
    const { svcId, keyId } = action?.payload;
    const response = yield call(axiosGetApiList, svcId, keyId);
    const apiList = (response?.data || []).filter(
      (api) => api?.subStat !== 'ERR',
    );
    const checkedList = [];
    apiList.forEach((value) => {
      const subStat = value?.subStat;
      if (subStat === 'N' || subStat === 'REJ' || subStat === 'CCL')
        checkedList.push(value.apiId);
      const reqParams = value?.reqParams;
      try {
        const info = reqParams ? JSON.parse(JSON.parse(reqParams)) : {};
        value.info = info;
      } catch (parseError) {
        console.error('Error parsing reqParams:', parseError);
        value.info = {};
      }
    });

    yield put(fetchApiListSuccess({ apiList, checkedList }));
  } catch (error) {
    yield put(fetchApiListFail());
  }
}

function* getManagerListSaga(action) {
  try {
    const { svcId } = action?.payload;
    const response = yield call(axiosGetManagerList, svcId);
    const managerList = response?.data?.response?.mngList || [];
    yield put(fetchManagerListSuccess(managerList));
  } catch (error) {
    yield put(fetchManagerListFail());
  }
}

function* getHistoryListSaga(action) {
  try {
    const { svcId } = action?.payload;
    const response = yield call(axiosGetHistoryList, svcId);
    const historyList = response?.data?.response.actHist || [];
    yield put(fetchHistoryListSuccess(historyList));
  } catch (error) {
    yield put(fetchHistoryListFail());
  }
}

function* updateHistorySaga(action) {
  try {
    const { svcId, actId, memo } = action?.payload;
    const response = yield call(axiosPutUpdateHistory, svcId, actId, memo);
    if (response.status === 200) {
      yield put(updateHistorySuccess());
    }
  } catch (error) {
    yield put(updateHistoryFail());
  }
}

function* requestSubscriptionPermissionSaga(action) {
  const { svcId, key, addToast, toastSuccess, toastWarning, toastError } =
    action?.payload || {};

  try {
    const body = {
      svcId,
      authCd: key?.authCd,
      authId: key?.prjId,
      keyId: key?.keyId,
    };
    const response = yield call(axiosPostRequestSubscriptionPermission, body);
    if (response.status === 200) {
      addToast(toastSuccess, 'success');
      yield put(requestSubscriptionPermissionSuccess());
    } else if (response?.response?.status === 400) {
      addToast(toastWarning, 'warning');
      yield put(requestSubscriptionPermissionFail());
    } else {
      addToast(toastError, 'error');
      yield put(requestSubscriptionPermissionFail());
    }
  } catch (error) {
    addToast(toastError, 'error');
    yield put(requestSubscriptionPermissionFail());
  }
}

function* requestSubscribeSaga(action) {
  const {
    svcId,
    apiList,
    keyId,
    addToast,
    toastSuccess,
    toastWarning,
    toastError,
  } = action?.payload || {};

  try {
    const body = [];

    for (const api of apiList) {
      const { pubId } = api;
      body.push({
        svcId,
        keyId,
        pubId,
        subStatCd: 'APR',
        aprvReason: '구독 신청',
      });
    }

    const response = yield call(axiosPutUpdateSubscribe, body);

    if (response.status === 200) {
      addToast(toastSuccess, 'success');
      yield put(requestSubscribeSuccess());
    } else if (response?.response?.status === 400) {
      addToast(toastWarning, 'warning');
      yield put(requestSubscribeFail());
    } else {
      addToast(toastError, 'error');
      yield put(requestSubscribeFail());
    }
  } catch (error) {
    addToast(toastError, 'error');
    yield put(requestSubscribeFail());
  }
}

function* requestCancelSubscribeSaga(action) {
  const {
    svcId,
    apiList,
    keyId,
    addToast,
    toastSuccess,
    toastWarning,
    toastError,
  } = action?.payload || {};

  try {
    const body = apiList
      .filter((api) => api.subStat !== 'N')
      .map((api) => {
        const { pubId } = api;
        return {
          svcId,
          keyId,
          pubId,
          subStatCd: 'CCL',
          aprvReason: '구독 해제',
        };
      });
    const response = yield call(axiosPutUpdateSubscribe, body);

    if (response.status === 200) {
      addToast(toastSuccess, 'success');
      yield put(cancelSubscribeSuccess());
    } else if (response?.response?.status === 400) {
      addToast(toastWarning, 'warning');
      yield put(cancelSubscribeFail());
    } else {
      addToast(toastError, 'error');
      yield put(cancelSubscribeFail());
    }
  } catch (error) {
    addToast(toastError, 'error');
    yield put(cancelSubscribeFail());
  }
}

function* reserveDeleteServiceSaga(action) {
  try {
    const { svcId, resDate, subCount, addToast, toast } = action?.payload;
    const response = yield call(
      axiosPutReserveDeleteService,
      svcId,
      resDate,
      subCount,
    );
    if (response.status === 200) {
      addToast(toast, 'success');
      yield put(reserveDeleteServiceSuccess());
    }
  } catch (error) {
    yield put(reserveDeleteServiceFail());
  }
}

function* cancelDeleteReserveSaga(action) {
  try {
    const { svcId, addToast, toast } = action?.payload;
    const response = yield call(axiosPutCancelDeleteReserve, svcId);
    if (response.status === 200) {
      addToast(toast, 'success');
      yield put(cancelDeleteReserveSuccess());
    }
  } catch (error) {
    yield put(cancelDeleteReserveFail());
  }
}

export default function* detailSaga() {
  yield takeLatest(increaseViewCount.type, increaseViewCountSaga);
  yield takeLatest(
    fetchSubscriptionPermission.type,
    getSubscriptionPermissionSaga,
  );
  yield takeLatest(fetchServiceDetail.type, getServiceDetailSaga);
  yield takeLatest(fetchApiList.type, getApiListSaga);
  yield takeLatest(fetchManagerList.type, getManagerListSaga);
  yield takeLatest(fetchHistoryList.type, getHistoryListSaga);
  yield takeLatest(updateHistory.type, updateHistorySaga);
  yield takeLatest(
    requestSubscriptionPermission.type,
    requestSubscriptionPermissionSaga,
  );
  yield takeLatest(requestSubscribe.type, requestSubscribeSaga);
  yield takeLatest(cancelSubscribe.type, requestCancelSubscribeSaga);
  yield takeLatest(reserveDeleteService.type, reserveDeleteServiceSaga);
  yield takeLatest(cancelDeleteReserve.type, cancelDeleteReserveSaga);
}


