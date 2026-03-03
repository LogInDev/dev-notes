// detail/saga.js
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

  // ✅ DRM
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
import axios from 'axios';

// ---------------- 기존 axios 함수들은 그대로 ----------------
// (중략: 너가 보내준 기존 코드 유지)

// =========================================================
// ✅ [CHANGED] DRM API axios
// =========================================================

// DRM 전체 설정 조회 (RootKey + allowIpList)
const axiosGetDrmConfig = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/drm/config`,
    { params: { svcId } },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// DRM 시스템 계정 사번 유효성 확인
const axiosVerifyDrmEmpNo = async (svcId, empNo) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/drm/empNo/verify`,
    { svcId, empNo },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// DRM 허용IP 추가/수정 (upsert)
const axiosUpsertDrmAllowIp = async ({ svcId, allowIpId, ipCidr }) => {
  // allowIpId가 있으면 수정, 없으면 추가
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/drm/allow-ip/upsert`,
    { svcId, allowIpId, ipCidr },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// DRM 허용IP 삭제
const axiosDeleteDrmAllowIp = async ({ svcId, allowIpId }) => {
  const response = await axios.post(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/api/drm/allow-ip/delete`,
    { svcId, allowIpId },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// =========================================================
// ✅ [CHANGED] DRM sagas
// =========================================================

function* fetchDrmConfigSaga(action) {
  try {
    const { svcId } = action?.payload || {};
    const response = yield call(axiosGetDrmConfig, svcId);
    const data = response?.data?.response || {};
    yield put(
      fetchDrmConfigSuccess({
        rootKey: data?.rootKey ?? null,
        allowIpList: data?.allowIpList || [],
      }),
    );
  } catch (e) {
    yield put(fetchDrmConfigFail());
  }
}

function* verifyDrmEmpNoSaga(action) {
  try {
    const { svcId, empNo } = action?.payload || {};
    const response = yield call(axiosVerifyDrmEmpNo, svcId, empNo);
    const res = response?.data?.response || {};
    // res.status: valid | duplicated | invalid
    yield put(
      verifyDrmEmpNoSuccess({
        empNo,
        status: res?.status || 'invalid',
      }),
    );
  } catch (e) {
    yield put(verifyDrmEmpNoFail());
  }
}

function* upsertDrmAllowIpSaga(action) {
  try {
    const { svcId, allowIpId, ipCidr } = action?.payload || {};
    const response = yield call(axiosUpsertDrmAllowIp, { svcId, allowIpId, ipCidr });
    const res = response?.data?.response || {};
    // 서버가 allowIpList를 최신으로 내려주는 방식 권장
    yield put(
      upsertDrmAllowIpSuccess({
        allowIpList: res?.allowIpList || [],
      }),
    );
  } catch (e) {
    yield put(upsertDrmAllowIpFail());
  }
}

function* deleteDrmAllowIpSaga(action) {
  try {
    const { svcId, allowIpId } = action?.payload || {};
    const response = yield call(axiosDeleteDrmAllowIp, { svcId, allowIpId });
    const res = response?.data?.response || {};
    yield put(
      deleteDrmAllowIpSuccess({
        allowIpList: res?.allowIpList || [],
      }),
    );
  } catch (e) {
    yield put(deleteDrmAllowIpFail());
  }
}

// ---------------- 기존 saga export에 추가 ----------------
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

  // ✅ [CHANGED] DRM sagas
  yield takeLatest(fetchDrmConfig.type, fetchDrmConfigSaga);
  yield takeLatest(verifyDrmEmpNo.type, verifyDrmEmpNoSaga);
  yield takeLatest(upsertDrmAllowIp.type, upsertDrmAllowIpSaga);
  yield takeLatest(deleteDrmAllowIp.type, deleteDrmAllowIpSaga);
}
