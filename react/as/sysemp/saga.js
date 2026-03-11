import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  // ... 기존 imports
  fetchDrmAllowIpList,
  fetchDrmAllowIpListSuccess,
  fetchDrmAllowIpListFail,
  saveDrmAllowIpChanges,
  saveDrmAllowIpChangesSuccess,
  saveDrmAllowIpChangesFail,
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
// 허용 IP 변경사항 저장
// ==========================
// Request 예시
// {
//   svcId,
//   createdList: [{ ip: '10.0.0.1' }],
//   updatedList: [{ ipId: 3, ip: '10.0.0.2' }],
//   deletedList: [{ ipId: 5 }]
// }
const axiosSaveDrmAllowIpChanges = async (
  svcId,
  createdList,
  updatedList,
  deletedList,
) => {
  return axios.put(`${process.env.VITE_REACT_APP_API_STORE_URL}/drm/allowIps`, {
    svcId,
    createdList,
    updatedList,
    deletedList,
  });
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

function* saveDrmAllowIpChangesSaga(action) {
  try {
    const {
      svcId,
      createdList = [],
      updatedList = [],
      deletedList = [],
    } = action?.payload || {};

    const res = yield call(
      axiosSaveDrmAllowIpChanges,
      svcId,
      createdList,
      updatedList,
      deletedList,
    );

    // 저장 후 서버 기준 최신 리스트 반환 권장
    const savedAllowIps = res?.data?.response?.allowIps || [];
    yield put(saveDrmAllowIpChangesSuccess(savedAllowIps));
  } catch (e) {
    yield put(saveDrmAllowIpChangesFail(parseAxiosError(e, 'SAVE_ERROR')));
  }
}

export default function* detailSaga() {
  // ... 기존 takeLatest들

  yield takeLatest(fetchDrmAllowIpList.type, fetchDrmAllowIpListSaga);
  yield takeLatest(saveDrmAllowIpChanges.type, saveDrmAllowIpChangesSaga);
}