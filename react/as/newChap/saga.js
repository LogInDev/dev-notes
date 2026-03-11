//detail/saga.js
import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  // ... 기존 import
  fetchDrmAllowIpList,
  fetchDrmAllowIpListSuccess,
  fetchDrmAllowIpListFail,
  saveDrmAllowIpList,
  saveDrmAllowIpListSuccess,
  saveDrmAllowIpListFail,
} from './reducer';

const parseAxiosError = (e, fallbackCode) => {
  const status = e?.response?.status;
  const code =
    status === 409
      ? 'DUPLICATE'
      : status === 400
        ? 'BAD_REQUEST'
        : status === 401
          ? 'UNAUTHORIZED'
          : status === 403
            ? 'FORBIDDEN'
            : status === 404
              ? 'NOT_FOUND'
              : status >= 500
                ? 'SERVER_ERROR'
                : fallbackCode;

  const message =
    e?.response?.data?.message ||
    e?.message ||
    '요청 처리 중 오류가 발생했습니다.';

  return { code, status, message };
};

// ==========================
// 허용 IP 조회
// ==========================
const axiosFetchDrmAllowIpList = async (svcId) => {
  return axios.get(`${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`, {
    params: { svcId },
  });
};

// ==========================
// 허용 IP 전체 저장
// ==========================
// Request 예시:
// {
//   svcId,
//   allowIps: [
//     { ipId: 1, ip: '10.0.0.1', sortOrder: 0 },
//     { ipId: null, ip: '10.0.0.0/25', sortOrder: 1 }
//   ]
// }
const axiosSaveDrmAllowIpList = async (svcId, allowIps) => {
  return axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`,
    {
      svcId,
      allowIps,
    },
  );
};

function* fetchDrmAllowIpListSaga(action) {
  try {
    const { svcId } = action?.payload || {};
    const res = yield call(axiosFetchDrmAllowIpList, svcId);

    const allowIps = res?.data?.response?.allowIps || [];
    yield put(fetchDrmAllowIpListSuccess(allowIps));
  } catch (e) {
    yield put(fetchDrmAllowIpListFail(parseAxiosError(e, 'FETCH_ERROR')));
  }
}

function* saveDrmAllowIpListSaga(action) {
  try {
    const { svcId, allowIps } = action?.payload || {};
    const res = yield call(axiosSaveDrmAllowIpList, svcId, allowIps);

    // 저장 후 서버 기준 최신 리스트 반환 권장
    const savedAllowIps = res?.data?.response?.allowIps || [];
    yield put(saveDrmAllowIpListSuccess(savedAllowIps));
  } catch (e) {
    yield put(saveDrmAllowIpListFail(parseAxiosError(e, 'SAVE_ERROR')));
  }
}

export default function* detailSaga() {
  // ... 기존 takeLatest

  yield takeLatest(fetchDrmAllowIpList.type, fetchDrmAllowIpListSaga);
  yield takeLatest(saveDrmAllowIpList.type, saveDrmAllowIpListSaga);
}