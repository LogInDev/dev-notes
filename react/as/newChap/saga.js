//detail/saga.js
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
  addDrmAllowIp,
  addDrmAllowIpSuccess,
  addDrmAllowIpFail,
  updateDrmAllowIp,
  updateDrmAllowIpSuccess,
  updateDrmAllowIpFail,
  deleteDrmAllowIp,
  deleteDrmAllowIpSuccess,
  deleteDrmAllowIpFail,

  // ✅ [ADD]
  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
} from './reducer';
import axios from 'axios';

/* ... (기존 axios 함수들 그대로) ... */

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

// =========================
// ✅ [ADD] RootKey 수정 API
// =========================
const axiosPutUpdateDrmRootKey = async (svcId, rootKey) => {
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/rootKey`,
    { svcId, rootKey },
  );
  return response;
};

/* ... (기존 saga들 그대로) ... */

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
      yield put(fetchServiceDetail({ svcId })); // ✅ allowIpList 최신화
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

// =========================
// ✅ [ADD] RootKey 수정 Saga
// =========================
function* updateDrmRootKeySaga(action) {
  const { svcId, rootKey, addToast, toastSuccess, toastError } =
    action?.payload || {};

  try {
    const res = yield call(axiosPutUpdateDrmRootKey, svcId, rootKey);

    if (res.status === 200) {
      addToast?.(toastSuccess, 'success');

      // 백엔드가 rootKey 내려주면 그걸 쓰고, 아니면 요청값으로 반영
      const nextRootKey =
        res?.data?.response?.rootKey !== undefined
          ? res?.data?.response?.rootKey
          : rootKey;

      yield put(updateDrmRootKeySuccess({ rootKey: nextRootKey }));

      // ✅ 화면 최신화 (allowIpList 포함)
      yield put(fetchServiceDetail({ svcId }));
    } else {
      addToast?.(toastError, 'error');
      yield put(updateDrmRootKeyFail());
    }
  } catch (e) {
    addToast?.(toastError, 'error');
    yield put(updateDrmRootKeyFail());
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

  // ✅ DRM allow IP (기존)
  yield takeLatest(addDrmAllowIp.type, addDrmAllowIpSaga);
  yield takeLatest(updateDrmAllowIp.type, updateDrmAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteDrmAllowIpSaga);

  // ✅ [ADD] DRM RootKey
  yield takeLatest(updateDrmRootKey.type, updateDrmRootKeySaga);
}