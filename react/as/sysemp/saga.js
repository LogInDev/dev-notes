// detail/saga.js
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

  fetchDrmAllowIpList,
  fetchDrmAllowIpListSuccess,
  fetchDrmAllowIpListFail,
  addDrmAllowIp,
  addDrmAllowIpSuccess,
  addDrmAllowIpFail,
  updateDrmAllowIp,
  updateDrmAllowIpSuccess,
  updateDrmAllowIpFail,
  deleteDrmAllowIp,
  deleteDrmAllowIpSuccess,
  deleteDrmAllowIpFail,

  setDrmAllowIps,
  addDrmAllowIpLocal,
  updateDrmAllowIpLocal,
  deleteDrmAllowIpLocal,
  replaceTempDrmAllowIp,

  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,

  // [DRM][NEW]
  fetchDrmEmpNoInfo,
  fetchDrmEmpNoInfoSuccess,
  fetchDrmEmpNoInfoFail,

  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,

  requestDrmSubscribe,
  requestDrmSubscribeSuccess,
  requestDrmSubscribeFail,

  // 기존 일반 구독 액션 재조회용
  fetchApiList as fetchApiListAction,
  fetchSubscriptionPermission as fetchSubscriptionPermissionAction,
} from './reducer';

const parseAxiosError = (e, fallbackCode) => {
  const status = e?.response?.status;
  const code =
    status === 409 ? 'DUPLICATE'
    : status === 400 ? 'BAD_REQUEST'
    : status === 401 ? 'UNAUTHORIZED'
    : status === 403 ? 'FORBIDDEN'
    : status === 404 ? 'NOT_FOUND'
    : status >= 500 ? 'SERVER_ERROR'
    : fallbackCode;

  const message =
    e?.response?.data?.message ||
    e?.message ||
    '요청 처리 중 오류가 발생했습니다.';

  return { code, status, message };
};

// =====================
// DRM axios
// =====================
const axiosFetchDrmAllowIps = async (svcId) => {
  return axios.get(`${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`, {
    params: { svcId },
  });
};

const axiosAddDrmAllowIp = async (svcId, ip) => {
  return axios.post(`${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`, {
    svcId,
    ip,
  });
};

const axiosUpdateDrmAllowIp = async (svcId, id, ip) => {
  return axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps/${id}`,
    { svcId, ip },
  );
};

const axiosDeleteDrmAllowIp = async (svcId, id) => {
  return axios.delete(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps/${id}`,
    { params: { svcId } },
  );
};

const axiosUpdateRootKey = async (svcId, rootKey) => {
  return axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/rootKey`,
    { svcId, rootKey },
  );
};

// [DRM][NEW] 선택 key 기준 시스템 사번 섹션 정보 조회
const axiosFetchDrmEmpNoInfo = async (svcId, keyId) => {
  return axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/info`,
    { params: { svcId, keyId } },
  );
};

const axiosVerifyEmpNo = async (svcId, keyId, empNo) => {
  return axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
    { params: { svcId, keyId, empNo } },
  );
};

// [DRM][NEW] 시스템 사번 구독 신청
const axiosRequestDrmSubscribe = async ({ svcId, keyId, empNo }) => {
  return axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/subscribe`,
    { svcId, keyId, empNo },
  );
};

// =====================
// [DRM] sagas
// =====================
function* fetchDrmAllowIpListSaga(action) {
  try {
    const { svcId } = action?.payload || {};
    const res = yield call(axiosFetchDrmAllowIps, svcId);
    const allowIps = res?.data?.response?.allowIps || [];
    yield put(setDrmAllowIps(allowIps));
    yield put(fetchDrmAllowIpListSuccess());
  } catch (e) {
    yield put(fetchDrmAllowIpListFail(parseAxiosError(e, 'FETCH_ERROR')));
  }
}

function* addDrmAllowIpSaga(action) {
  const { svcId, ip, tempId } = action?.payload || {};
  const optimisticItem = {
    id: tempId,
    ip,
    isTemp: true,
  };

  try {
    yield put(addDrmAllowIpLocal(optimisticItem));

    const res = yield call(axiosAddDrmAllowIp, svcId, ip);
    const created = res?.data?.response?.item || res?.data?.response;

    if (created?.id) {
      yield put(replaceTempDrmAllowIp({ tempId, item: created }));
    } else {
      const allowIps = res?.data?.response?.allowIps;
      if (Array.isArray(allowIps)) yield put(setDrmAllowIps(allowIps));
      else {
        yield put(replaceTempDrmAllowIp({
          tempId,
          item: { ...optimisticItem, isTemp: false },
        }));
      }
    }

    yield put(addDrmAllowIpSuccess());
  } catch (e) {
    yield put(deleteDrmAllowIpLocal(tempId));
    yield put(addDrmAllowIpFail(parseAxiosError(e, 'ADD_ERROR')));
  }
}

function* updateDrmAllowIpSaga(action) {
  const { svcId, id, ip, prevIp } = action?.payload || {};
  try {
    yield put(updateDrmAllowIpLocal({ id, ip }));

    const res = yield call(axiosUpdateDrmAllowIp, svcId, id, ip);
    const updated = res?.data?.response?.item || res?.data?.response;
    if (updated?.id && updated?.ip) {
      yield put(updateDrmAllowIpLocal({ id: updated.id, ip: updated.ip }));
    }

    yield put(updateDrmAllowIpSuccess());
  } catch (e) {
    if (prevIp !== undefined) yield put(updateDrmAllowIpLocal({ id, ip: prevIp }));
    yield put(updateDrmAllowIpFail(parseAxiosError(e, 'UPDATE_ERROR')));
  }
}

function* deleteDrmAllowIpSaga(action) {
  const { svcId, id, backup } = action?.payload || {};
  try {
    yield put(deleteDrmAllowIpLocal(id));
    yield call(axiosDeleteDrmAllowIp, svcId, id);
    yield put(deleteDrmAllowIpSuccess());
  } catch (e) {
    if (backup) yield put(addDrmAllowIpLocal(backup));
    yield put(deleteDrmAllowIpFail(parseAxiosError(e, 'DELETE_ERROR')));
  }
}

function* updateDrmRootKeySaga(action) {
  try {
    const { svcId, rootKey } = action?.payload || {};
    const res = yield call(axiosUpdateRootKey, svcId, rootKey);
    const updatedRootKey = res?.data?.response?.rootKey || rootKey;
    yield put(updateDrmRootKeySuccess({ rootKey: updatedRootKey }));
  } catch (e) {
    yield put(updateDrmRootKeyFail(parseAxiosError(e, 'ROOTKEY_UPDATE_ERROR')));
  }
}

// [DRM][NEW]
function* fetchDrmEmpNoInfoSaga(action) {
  try {
    const { svcId, keyId } = action?.payload || {};
    if (!svcId || !keyId) {
      yield put(fetchDrmEmpNoInfoFail({
        code: 'BAD_REQUEST',
        message: 'svcId 또는 keyId가 없습니다.',
      }));
      return;
    }

    const res = yield call(axiosFetchDrmEmpNoInfo, svcId, keyId);
    const info = res?.data?.response || res?.data || null;
    yield put(fetchDrmEmpNoInfoSuccess(info));
  } catch (e) {
    yield put(fetchDrmEmpNoInfoFail(parseAxiosError(e, 'EMPNO_INFO_ERROR')));
  }
}

function* verifyDrmEmpNoSaga(action) {
  try {
    const { svcId, keyId, empNo } = action?.payload || {};
    const res = yield call(axiosVerifyEmpNo, svcId, keyId, empNo);
    const result = res?.data?.response || res?.data;
    yield put(verifyDrmEmpNoSuccess(result));
  } catch (e) {
    yield put(verifyDrmEmpNoFail(parseAxiosError(e, 'EMPNO_VERIFY_ERROR')));
  }
}

// [DRM][NEW]
function* requestDrmSubscribeSaga(action) {
  try {
    const { svcId, keyId, empNo } = action?.payload || {};
    yield call(axiosRequestDrmSubscribe, { svcId, keyId, empNo });
    yield put(requestDrmSubscribeSuccess());

    // 신청 후 key 기준 정보 재조회
    yield put(fetchDrmEmpNoInfo({ svcId, keyId }));

    // 기존 화면 영향 받는 영역도 재조회
    yield put(fetchSubscriptionPermissionAction({ svcId, keyId }));
    yield put(fetchApiListAction({ svcId, keyId }));
  } catch (e) {
    yield put(requestDrmSubscribeFail(parseAxiosError(e, 'DRM_SUBSCRIBE_ERROR')));
  }
}

export default function* detailSaga() {
  // 기존 takeLatest들 그대로 유지

  yield takeLatest(fetchDrmAllowIpList.type, fetchDrmAllowIpListSaga);
  yield takeLatest(addDrmAllowIp.type, addDrmAllowIpSaga);
  yield takeLatest(updateDrmAllowIp.type, updateDrmAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteDrmAllowIpSaga);
  yield takeLatest(updateDrmRootKey.type, updateDrmRootKeySaga);

  // [DRM][NEW]
  yield takeLatest(fetchDrmEmpNoInfo.type, fetchDrmEmpNoInfoSaga);
  yield takeLatest(verifyDrmEmpNo.type, verifyDrmEmpNoSaga);
  yield takeLatest(requestDrmSubscribe.type, requestDrmSubscribeSaga);
}
