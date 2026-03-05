/* =========================
 * detail/saga.js 에 추가할 것
 * - updateDrmRootKey takeLatest + axios
 * - 성공 시 fetchServiceDetail 재조회 (rootKey 갱신)
 * ========================= */

import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';

import {
  // ... 기존 import 그대로
  fetchServiceDetail,
  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
} from './reducer';

const axiosUpdateDrmRootKey = async (body) => {
  // 예시 endpoint (원하는대로 백엔드에서 맞춰)
  // PUT /drm/root-key  body: { svcId, rootKey }
  const response = await axios.put(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/drm/root-key`,
    body,
  );
  return response;
};

function* updateDrmRootKeySaga(action) {
  const { svcId, rootKey, addToast, toastSuccess, toastError } =
    action?.payload || {};

  try {
    const res = yield call(axiosUpdateDrmRootKey, { svcId, rootKey });

    if (res.status === 200) {
      addToast?.(toastSuccess, 'success');
      yield put(updateDrmRootKeySuccess());

      // ✅ 화면 갱신 (rootKey 최신값 다시 받기)
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
  // ... 기존 takeLatest 그대로
  yield takeLatest(updateDrmRootKey.type, updateDrmRootKeySaga);
}

/* =========================
 * detail/reducer.js 에 추가할 것
 * - 너 initialState.drm.* 구조 유지 (drm 하위)
 * - updateDrmRootKey 액션 추가
 * ========================= */

import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  // ... (너가 올린 initialState 그대로)
  drm: {
    allowIpList: [],
    addAllowIpLoading: false,
    addAllowIpSuccess: false,
    updateAllowIpLoading: false,
    updateAllowIpSuccess: false,
    deleteAllowIpLoading: false,
    deleteAllowIpSuccess: false,
    updateRootKeyLoading: false,
    updateRootKeySuccess: false,
  },
  // ...
};

const detailSlice = createSlice({
  name: 'detail',
  initialState,
  reducers: {
    // ... 기존 reducers 그대로

    // ✅ RootKey 업데이트 (drm 하위)
    updateDrmRootKey: (state) => {
      state.drm.updateRootKeyLoading = true;
      state.drm.updateRootKeySuccess = false;
    },
    updateDrmRootKeySuccess: (state) => {
      state.drm.updateRootKeyLoading = false;
      state.drm.updateRootKeySuccess = true;
    },
    updateDrmRootKeyFail: (state) => {
      state.drm.updateRootKeyLoading = false;
    },
  },
});

export const {
  // ... 기존 export 그대로
  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
} = detailSlice.actions;

export default detailSlice.reducer;
