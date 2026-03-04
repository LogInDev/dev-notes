// store/reduxStore/detail/saga.js
import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
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

  // ✅ [ADDED]
  addDrmAllowIp,
  addDrmAllowIpSuccess,
  addDrmAllowIpFail,
  updateDrmAllowIp,
  updateDrmAllowIpSuccess,
  updateDrmAllowIpFail,
  deleteDrmAllowIp,
  deleteDrmAllowIpSuccess,
  deleteDrmAllowIpFail,
} from './reducer';

/* ---------------- existing axios ---------------- */
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

/* ---------------- ✅ [ADDED] DRM allow IP axios ---------------- */
// 응답코드 정책은 팀 API에 맞춰 조정 가능
const axiosAddDrmAllowIp = async (body) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allow-ips`,
    body,
  );
  return response;
};

const axiosUpdateDrmAllowIp = async (allowIpId, body) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allow-ips/${allowIpId}`,
    body,
  );
  return response;
};

const axiosDeleteDrmAllowIp = async (allowIpId, svcId) => {
  const response = await axios.delete(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allow-ips/${allowIpId}`,
    { params: { svcId } },
  );
  return response;
};

/* ---------------- existing sagas ---------------- */
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

    // ✅ allowIps/rootKey는 /api/dtl 응답에 포함시키는 방식 권장
    // serviceDetail.drm.allowIps / serviceDetail.rootKey

    yield put(fetchServiceDetailSuccess(serviceDetail));
  } catch (error) {
    yield put(fetchServiceDetailFail());
  }
}

function* getApiListSaga(action) {
  try {
    const { svcId, keyId } = action?.payload;
    const response = yield call(axiosGetApiList, svcId, keyId);
    const apiList = (response?.data || []).filter((api) => api?.subStat !== 'ERR');
    const checkedList = [];
    apiList.forEach((value) => {
      const subStat = value?.subStat;
      if (subStat === 'N' || subStat === 'REJ' || subStat === 'CCL') {
        checkedList.push(value.apiId);
      }
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
  const { svcId, apiList, keyId, addToast, toastSuccess, toastWarning, toastError } =
    action?.payload || {};

  try {
    const body = apiList.map((api) => ({
      svcId,
      keyId,
      pubId: api.pubId,
      subStatCd: 'APR',
      aprvReason: '구독 신청',
    }));

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
  const { svcId, apiList, keyId, addToast, toastSuccess, toastWarning, toastError } =
    action?.payload || {};

  try {
    const body = apiList
      .filter((api) => api.subStat !== 'N')
      .map((api) => ({
        svcId,
        keyId,
        pubId: api.pubId,
        subStatCd: 'CCL',
        aprvReason: '구독 해제',
      }));

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
    const response = yield call(axiosPutReserveDeleteService, svcId, resDate, subCount);
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

/* ---------------- ✅ [ADDED] DRM allow IP sagas ---------------- */
function* addDrmAllowIpSaga(action) {
  const {
    svcId,
    ipCidr,
    addToast,
    toastSuccess,
    toastError,
    toastDuplicated,
  } = action?.payload || {};

  try {
    const res = yield call(axiosAddDrmAllowIp, { svcId, ipCidr });

    if (res.status === 200) {
      addToast?.(toastSuccess, 'success');
      yield put(addDrmAllowIpSuccess());

      // ✅ 서버와 완전 동기화(버그 최소)
      yield put(fetchServiceDetail({ svcId }));
    } else if (res?.response?.status === 409) {
      addToast?.(toastDuplicated, 'warning');
      yield put(addDrmAllowIpFail());
    } else {
      addToast?.(toastError, 'error');
      yield put(addDrmAllowIpFail());
    }
  } catch (e) {
    const status = e?.response?.status;
    if (status === 409) addToast?.(toastDuplicated, 'warning');
    else addToast?.(toastError, 'error');
    yield put(addDrmAllowIpFail());
  }
}

function* updateDrmAllowIpSaga(action) {
  const {
    svcId,
    allowIpId,
    ipCidr,
    addToast,
    toastSuccess,
    toastError,
    toastDuplicated,
  } = action?.payload || {};

  try {
    const res = yield call(axiosUpdateDrmAllowIp, allowIpId, { svcId, ipCidr });

    if (res.status === 200) {
      addToast?.(toastSuccess, 'success');
      yield put(updateDrmAllowIpSuccess());
      yield put(fetchServiceDetail({ svcId }));
    } else if (res?.response?.status === 409) {
      addToast?.(toastDuplicated, 'warning');
      yield put(updateDrmAllowIpFail());
    } else {
      addToast?.(toastError, 'error');
      yield put(updateDrmAllowIpFail());
    }
  } catch (e) {
    const status = e?.response?.status;
    if (status === 409) addToast?.(toastDuplicated, 'warning');
    else addToast?.(toastError, 'error');
    yield put(updateDrmAllowIpFail());
  }
}

function* deleteDrmAllowIpSaga(action) {
  const { svcId, allowIpId, addToast, toastSuccess, toastError } =
    action?.payload || {};

  try {
    const res = yield call(axiosDeleteDrmAllowIp, allowIpId, svcId);

    if (res.status === 200) {
      addToast?.(toastSuccess, 'success');
      yield put(deleteDrmAllowIpSuccess());
      yield put(fetchServiceDetail({ svcId }));
    } else {
      addToast?.(toastError, 'error');
      yield put(deleteDrmAllowIpFail());
    }
  } catch (e) {
    addToast?.(toastError, 'error');
    yield put(deleteDrmAllowIpFail());
  }
}

export default function* detailSaga() {
  yield takeLatest(increaseViewCount.type, increaseViewCountSaga);
  yield takeLatest(fetchSubscriptionPermission.type, getSubscriptionPermissionSaga);
  yield takeLatest(fetchServiceDetail.type, getServiceDetailSaga);
  yield takeLatest(fetchApiList.type, getApiListSaga);
  yield takeLatest(fetchManagerList.type, getManagerListSaga);
  yield takeLatest(fetchHistoryList.type, getHistoryListSaga);
  yield takeLatest(updateHistory.type, updateHistorySaga);
  yield takeLatest(requestSubscriptionPermission.type, requestSubscriptionPermissionSaga);
  yield takeLatest(requestSubscribe.type, requestSubscribeSaga);
  yield takeLatest(cancelSubscribe.type, requestCancelSubscribeSaga);
  yield takeLatest(reserveDeleteService.type, reserveDeleteServiceSaga);
  yield takeLatest(cancelDeleteReserve.type, cancelDeleteReserveSaga);

  // ✅ [ADDED]
  yield takeLatest(addDrmAllowIp.type, addDrmAllowIpSaga);
  yield takeLatest(updateDrmAllowIp.type, updateDrmAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteDrmAllowIpSaga);
}