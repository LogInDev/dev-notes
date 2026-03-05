// detail/reducer.js
import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  // ... (기존 그대로)

  // [DRM][ADDED] DRM 시스템 사번 검증
  drmEmpNo: {
    status: 'idle', // idle | checking | valid | duplicated | invalid
    verifiedEmpNo: null, // 마지막 valid로 확인된 empNo
    cache: {}, // { [empNo]: "valid"|"duplicated"|"invalid" } - saga에서 갱신
    loading: false,
    success: false,
    error: null,
  },

  // [DRM][ADDED] RootKey 조회/수정
  drmRootKey: {
    updating: false,
    updateSuccess: false,
    updateError: null,
  },

  // [DRM][ADDED] 허용IP CRUD
  drmAllowIp: {
    fetchLoading: false,
    requestLoading: false, // add/update/delete 공용
    lastAction: null, // "add"|"update"|"delete"|"fetch"
    success: false,
    error: null,
  },
};

const detailSlice = createSlice({
  name: 'detail',
  initialState,
  reducers: {
    // ... (기존 reducers 그대로)

    // ======================================================
    // [DRM][ADDED] EmpNo Verify
    // ======================================================
    verifyDrmEmpNo: (state) => {
      state.drmEmpNo.loading = true;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = null;
      state.drmEmpNo.status = 'checking';
    },
    verifyDrmEmpNoSuccess: (state, action) => {
      const { empNo, status } = action.payload || {};
      state.drmEmpNo.loading = false;
      state.drmEmpNo.success = true;
      state.drmEmpNo.error = null;
      state.drmEmpNo.status = status || 'invalid';

      // 캐시 갱신
      if (empNo) state.drmEmpNo.cache[empNo] = state.drmEmpNo.status;

      // valid인 경우에만 verifiedEmpNo 세팅
      state.drmEmpNo.verifiedEmpNo =
        state.drmEmpNo.status === 'valid' ? empNo : null;
    },
    verifyDrmEmpNoFail: (state, action) => {
      state.drmEmpNo.loading = false;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = action?.payload || 'ERROR';
      state.drmEmpNo.status = 'idle';
      state.drmEmpNo.verifiedEmpNo = null;
    },
    resetDrmEmpNoStatus: (state) => {
      state.drmEmpNo.status = 'idle';
      state.drmEmpNo.loading = false;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = null;
      state.drmEmpNo.verifiedEmpNo = null;
      // cache는 유지(성능/중복호출 방지)
    },

    // ======================================================
    // [DRM][ADDED] RootKey Update
    // ======================================================
    updateDrmRootKey: (state) => {
      state.drmRootKey.updating = true;
      state.drmRootKey.updateSuccess = false;
      state.drmRootKey.updateError = null;
    },
    updateDrmRootKeySuccess: (state) => {
      state.drmRootKey.updating = false;
      state.drmRootKey.updateSuccess = true;
      state.drmRootKey.updateError = null;
    },
    updateDrmRootKeyFail: (state, action) => {
      state.drmRootKey.updating = false;
      state.drmRootKey.updateSuccess = false;
      state.drmRootKey.updateError = action?.payload || 'ERROR';
    },
    resetDrmRootKeyResult: (state) => {
      state.drmRootKey.updateSuccess = false;
      state.drmRootKey.updateError = null;
    },

    // ======================================================
    // [DRM][ADDED] Allow IP CRUD
    // ======================================================
    fetchDrmAllowIpList: (state) => {
      state.drmAllowIp.fetchLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'fetch';
    },
    fetchDrmAllowIpListSuccess: (state) => {
      state.drmAllowIp.fetchLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    fetchDrmAllowIpListFail: (state, action) => {
      state.drmAllowIp.fetchLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || 'ERROR';
    },

    addDrmAllowIp: (state) => {
      state.drmAllowIp.requestLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'add';
    },
    addDrmAllowIpSuccess: (state) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    addDrmAllowIpFail: (state, action) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || 'ERROR';
    },

    updateDrmAllowIp: (state) => {
      state.drmAllowIp.requestLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'update';
    },
    updateDrmAllowIpSuccess: (state) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    updateDrmAllowIpFail: (state, action) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || 'ERROR';
    },

    deleteDrmAllowIp: (state) => {
      state.drmAllowIp.requestLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'delete';
    },
    deleteDrmAllowIpSuccess: (state) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    deleteDrmAllowIpFail: (state, action) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || 'ERROR';
    },

    resetDrmAllowIpResult: (state) => {
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = null;
    },
  },
});

export const {
  // ... 기존 export 그대로

  // [DRM][ADDED] exports
  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,
  resetDrmEmpNoStatus,

  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
  resetDrmRootKeyResult,

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

  resetDrmAllowIpResult,
} = detailSlice.actions;

export default detailSlice.reducer;