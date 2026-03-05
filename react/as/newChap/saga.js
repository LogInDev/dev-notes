//detail/saga.js
import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  // 기존 imports...
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

  // [DRM][ADDED]
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

  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,
} from './reducer';

// =====================
// helpers
// =====================
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

const axiosVerifyEmpNo = async (svcId, empNo) => {
  return axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
    { params: { svcId, empNo } },
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

/**
 * ✅ 다음단계(optimistic):
 * - temp row를 먼저 store에 push
 * - 성공 시 tempId를 real item으로 replace
 * - 실패 시 temp row 삭제 롤백
 */
function* addDrmAllowIpSaga(action) {
  const { svcId, ip, tempId } = action?.payload || {};
  const optimisticItem = {
    id: tempId,
    ip,
    isTemp: true,
  };

  try {
    // optimistic 적용
    yield put(addDrmAllowIpLocal(optimisticItem));

    const res = yield call(axiosAddDrmAllowIp, svcId, ip);

    // 서버는 생성된 row를 내려주는 걸 추천
    const created = res?.data?.response?.item || res?.data?.response;

    if (created?.id) {
      yield put(replaceTempDrmAllowIp({ tempId, item: created }));
    } else {
      // fallback: 서버가 allowIps를 내려주는 경우
      const allowIps = res?.data?.response?.allowIps;
      if (Array.isArray(allowIps)) yield put(setDrmAllowIps(allowIps));
      else {
        // 최후 fallback: optimistic item에서 isTemp만 제거
        yield put(replaceTempDrmAllowIp({
          tempId,
          item: { ...optimisticItem, isTemp: false },
        }));
      }
    }

    yield put(addDrmAllowIpSuccess());
  } catch (e) {
    // 롤백
    yield put(deleteDrmAllowIpLocal(tempId));
    yield put(addDrmAllowIpFail(parseAxiosError(e, 'ADD_ERROR')));
  }
}

/**
 * ✅ 다음단계(optimistic):
 * - update는 즉시 반영 -> 실패 시 prevIp로 롤백
 */
function* updateDrmAllowIpSaga(action) {
  const { svcId, id, ip, prevIp } = action?.payload || {};
  try {
    // optimistic 적용
    yield put(updateDrmAllowIpLocal({ id, ip }));

    const res = yield call(axiosUpdateDrmAllowIp, svcId, id, ip);
    const updated = res?.data?.response?.item || res?.data?.response;
    if (updated?.id && updated?.ip) {
      yield put(updateDrmAllowIpLocal({ id: updated.id, ip: updated.ip }));
    }

    yield put(updateDrmAllowIpSuccess());
  } catch (e) {
    // 롤백
    if (prevIp !== undefined) yield put(updateDrmAllowIpLocal({ id, ip: prevIp }));
    yield put(updateDrmAllowIpFail(parseAxiosError(e, 'UPDATE_ERROR')));
  }
}

/**
 * ✅ 다음단계(optimistic):
 * - delete는 즉시 제거 -> 실패 시 backup row로 복구
 */
function* deleteDrmAllowIpSaga(action) {
  const { svcId, id, backup } = action?.payload || {};
  try {
    // optimistic 적용
    yield put(deleteDrmAllowIpLocal(id));

    yield call(axiosDeleteDrmAllowIp, svcId, id);

    yield put(deleteDrmAllowIpSuccess());
  } catch (e) {
    // 롤백
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

function* verifyDrmEmpNoSaga(action) {
  try {
    const { svcId, empNo } = action?.payload || {};
    const res = yield call(axiosVerifyEmpNo, svcId, empNo);
    // response 예: { response: { empNo: 'X99...', status: 'VALID' } }
    const result = res?.data?.response || res?.data;
    yield put(verifyDrmEmpNoSuccess(result));
  } catch (e) {
    yield put(verifyDrmEmpNoFail(parseAxiosError(e, 'EMPNO_VERIFY_ERROR')));
  }
}

// =====================
// 기존 sagas (너가 올린 것들) 그대로 두고
// 마지막 export default에서 takeLatest만 추가
// =====================
export default function* detailSaga() {
  // ===== 기존 takeLatest들 그대로 =====
  // yield takeLatest(increaseViewCount.type, increaseViewCountSaga);
  // yield takeLatest(fetchSubscriptionPermission.type, getSubscriptionPermissionSaga);
  // ... etc

  // ===== [DRM][ADDED] =====
  yield takeLatest(fetchDrmAllowIpList.type, fetchDrmAllowIpListSaga);
  yield takeLatest(addDrmAllowIp.type, addDrmAllowIpSaga);
  yield takeLatest(updateDrmAllowIp.type, updateDrmAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteDrmAllowIpSaga);

  yield takeLatest(updateDrmRootKey.type, updateDrmRootKeySaga);
  yield takeLatest(verifyDrmEmpNo.type, verifyDrmEmpNoSaga);
}