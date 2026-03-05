//detail/saga.js
import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  // ... 기존 import 그대로

  // [DRM][ADDED]
  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,

  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,

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

  // 기존에 있는 서비스 상세 fetch
  fetchServiceDetail,
} from './reducer';

// ===============================
// [DRM][ADDED] axios
// ===============================
const axiosVerifyDrmEmpNo = async (empNo) => {
  return axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
    { params: { empNo } },
  );
};

// RootKey 업데이트(예시)
const axiosUpdateDrmRootKey = async (svcId, rootKey) => {
  return axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/rootKey`,
    { svcId, rootKey },
  );
};

// Allow IP CRUD(예시)
const axiosFetchDrmAllowIps = async (svcId) => {
  return axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`,
    { params: { svcId } },
  );
};

const axiosAddDrmAllowIp = async (svcId, ip) => {
  return axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`,
    { svcId, ip },
  );
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

// ===============================
// [DRM][ADDED] sagas
// ===============================
function* verifyDrmEmpNoSaga(action) {
  try {
    const empNoRaw = action?.payload?.empNo || '';
    const empNo = empNoRaw.trim().toUpperCase();

    // 캐시 힌트: 컴포넌트에서 cache 조회 후 dispatch를 줄이는 게 가장 효율적
    const res = yield call(axiosVerifyDrmEmpNo, empNo);

    // 서버 응답 예시: { response: { status: "VALID"|"DUPLICATED"|"INVALID" } }
    const statusRaw =
      res?.data?.response?.status || res?.data?.status || 'INVALID';

    const normalized =
      statusRaw === 'VALID'
        ? 'valid'
        : statusRaw === 'DUPLICATED'
          ? 'duplicated'
          : 'invalid';

    yield put(verifyDrmEmpNoSuccess({ empNo, status: normalized }));
  } catch (e) {
    yield put(verifyDrmEmpNoFail('VERIFY_ERROR'));
  }
}

function* updateDrmRootKeySaga(action) {
  try {
    const { svcId, rootKey } = action?.payload || {};
    const res = yield call(axiosUpdateDrmRootKey, svcId, rootKey);

    if (res.status === 200) {
      yield put(updateDrmRootKeySuccess());
      // RootKey는 serviceDetail 안에 있으니 최신화
      yield put(fetchServiceDetail({ svcId }));
    } else {
      yield put(updateDrmRootKeyFail('UPDATE_FAIL'));
    }
  } catch (e) {
    yield put(updateDrmRootKeyFail('UPDATE_ERROR'));
  }
}

function* fetchDrmAllowIpListSaga(action) {
  try {
    const { svcId } = action?.payload || {};
    const res = yield call(axiosFetchDrmAllowIps, svcId);

    // ✅ allowIp는 serviceDetail에 넣어 쓰는 구조를 유지하려면
    // fetchServiceDetail을 재호출하는 방식이 가장 안전(단, 비용 큼)
    // 여기서는 "최소 버그" 기준으로 serviceDetail refresh.
    if (res.status === 200) {
      yield put(fetchDrmAllowIpListSuccess());
      yield put(fetchServiceDetail({ svcId }));
    } else {
      yield put(fetchDrmAllowIpListFail('FETCH_FAIL'));
    }
  } catch (e) {
    yield put(fetchDrmAllowIpListFail('FETCH_ERROR'));
  }
}

function* addDrmAllowIpSaga(action) {
  try {
    const { svcId, ip } = action?.payload || {};
    const res = yield call(axiosAddDrmAllowIp, svcId, ip);

    if (res.status === 200 || res.status === 201) {
      yield put(addDrmAllowIpSuccess());
      yield put(fetchServiceDetail({ svcId })); // 최신화
    } else {
      yield put(addDrmAllowIpFail('ADD_FAIL'));
    }
  } catch (e) {
    // 서버가 "중복"을 409로 주면 여기서 분기 가능
    yield put(addDrmAllowIpFail('ADD_ERROR'));
  }
}

function* updateDrmAllowIpSaga(action) {
  try {
    const { svcId, id, ip } = action?.payload || {};
    const res = yield call(axiosUpdateDrmAllowIp, svcId, id, ip);

    if (res.status === 200) {
      yield put(updateDrmAllowIpSuccess());
      yield put(fetchServiceDetail({ svcId }));
    } else {
      yield put(updateDrmAllowIpFail('UPDATE_FAIL'));
    }
  } catch (e) {
    yield put(updateDrmAllowIpFail('UPDATE_ERROR'));
  }
}

function* deleteDrmAllowIpSaga(action) {
  try {
    const { svcId, id } = action?.payload || {};
    const res = yield call(axiosDeleteDrmAllowIp, svcId, id);

    if (res.status === 200) {
      yield put(deleteDrmAllowIpSuccess());
      yield put(fetchServiceDetail({ svcId }));
    } else {
      yield put(deleteDrmAllowIpFail('DELETE_FAIL'));
    }
  } catch (e) {
    yield put(deleteDrmAllowIpFail('DELETE_ERROR'));
  }
}

export default function* detailSaga() {
  // ... 기존 takeLatest 그대로

  // [DRM][ADDED]
  yield takeLatest(verifyDrmEmpNo.type, verifyDrmEmpNoSaga);
  yield takeLatest(updateDrmRootKey.type, updateDrmRootKeySaga);

  yield takeLatest(fetchDrmAllowIpList.type, fetchDrmAllowIpListSaga);
  yield takeLatest(addDrmAllowIp.type, addDrmAllowIpSaga);
  yield takeLatest(updateDrmAllowIp.type, updateDrmAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteDrmAllowIpSaga);
}