import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  // ... 기존 imports
  fetchDrmConfig,
  fetchDrmConfigSuccess,
  fetchDrmConfigFail,
  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,
  upsertDrmAllowIp,
  upsertDrmAllowIpSuccess,
  upsertDrmAllowIpFail,
  deleteDrmAllowIp,
  deleteDrmAllowIpSuccess,
  deleteDrmAllowIpFail,
} from './reducer';

// ✅ DRM: config
const axiosGetDrmConfig = async (svcId) => {
  const res = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/config`,
    { params: { svcId } },
  );
  if (!res.status || res.status < 200 || res.status >= 300) throw new Error(res);
  return res;
};

// ✅ DRM: empNo verify
const axiosVerifyDrmEmpNo = async (svcId, empNo) => {
  // 네 기존 코드가 GET /drm/empNo/verify?empNo= 이었음.
  // svcId도 같이 보내는 게 실무상 맞아서 params에 같이 넣음.
  const res = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/empNo/verify`,
    { params: { svcId, empNo } },
  );
  if (!res.status || res.status < 200 || res.status >= 300) throw new Error(res);
  return res;
};

// ✅ DRM: allow ip upsert
const axiosUpsertAllowIp = async ({ svcId, allowIpId, ipCidr }) => {
  const res = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allow-ip/upsert`,
    { svcId, allowIpId, ipCidr },
  );
  if (!res.status || res.status < 200 || res.status >= 300) throw new Error(res);
  return res;
};

// ✅ DRM: allow ip delete
const axiosDeleteAllowIp = async ({ svcId, allowIpId }) => {
  const res = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allow-ip/delete`,
    { svcId, allowIpId },
  );
  if (!res.status || res.status < 200 || res.status >= 300) throw new Error(res);
  return res;
};

function* fetchDrmConfigSaga(action) {
  try {
    const { svcId } = action?.payload || {};
    const res = yield call(axiosGetDrmConfig, svcId);
    const data = res?.data?.response || {};
    yield put(fetchDrmConfigSuccess({
      rootKey: data?.rootKey ?? null,
      allowIpList: data?.allowIpList || [],
    }));
  } catch (e) {
    yield put(fetchDrmConfigFail());
  }
}

function* verifyDrmEmpNoSaga(action) {
  try {
    const { svcId, empNo } = action?.payload || {};
    const res = yield call(axiosVerifyDrmEmpNo, svcId, empNo);
    const statusRaw = res?.data?.response?.status || res?.data?.status;

    const normalized =
      statusRaw === 'VALID' ? 'valid' :
      statusRaw === 'DUPLICATED' ? 'duplicated' :
      'invalid';

    yield put(verifyDrmEmpNoSuccess({ empNo, status: normalized }));
  } catch (e) {
    yield put(verifyDrmEmpNoFail());
  }
}

function* upsertAllowIpSaga(action) {
  try {
    const payload = action?.payload || {};
    const res = yield call(axiosUpsertAllowIp, payload);
    const data = res?.data?.response || {};
    yield put(upsertDrmAllowIpSuccess({ allowIpList: data?.allowIpList || [] }));
  } catch (e) {
    yield put(upsertDrmAllowIpFail());
  }
}

function* deleteAllowIpSaga(action) {
  try {
    const payload = action?.payload || {};
    const res = yield call(axiosDeleteAllowIp, payload);
    const data = res?.data?.response || {};
    yield put(deleteDrmAllowIpSuccess({ allowIpList: data?.allowIpList || [] }));
  } catch (e) {
    yield put(deleteDrmAllowIpFail());
  }
}

// ✅ 기존 detailSaga export에 추가
export default function* detailSaga() {
  // ... 기존 takeLatest들

  yield takeLatest(fetchDrmConfig.type, fetchDrmConfigSaga);
  yield takeLatest(verifyDrmEmpNo.type, verifyDrmEmpNoSaga);
  yield takeLatest(upsertDrmAllowIp.type, upsertAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteAllowIpSaga);
}
