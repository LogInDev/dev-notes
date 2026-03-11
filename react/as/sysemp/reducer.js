// detail/reducer.js

import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  // ... 기존 state

  drmAllowIp: {
    fetchLoading: false,
    saveLoading: false,
    success: false,
    error: null,
    lastAction: null, // 'fetch' | 'save'
  },
};

const detailSlice = createSlice({
  name: 'detail',
  initialState,
  reducers: {
    initState: () => {
      return initialState;
    },

    updateField: (state, action) => {
      const { field, value } = action.payload;
      set(state, field, value);
    },

    // ... 기존 reducer들

    // =========================
    // [DRM] 허용 IP 조회
    // =========================
    fetchDrmAllowIpList: (state) => {
      state.drmAllowIp.fetchLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'fetch';
    },
    fetchDrmAllowIpListSuccess: (state, action) => {
      state.drmAllowIp.fetchLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;

      if (!state.detail.serviceDetail) {
        state.detail.serviceDetail = {};
      }
      state.detail.serviceDetail.drmAllowIps = action?.payload || [];
    },
    fetchDrmAllowIpListFail: (state, action) => {
      state.drmAllowIp.fetchLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || { code: 'FETCH_ERROR' };
    },

    // =========================
    // [DRM] 허용 IP 변경사항 저장
    // =========================
    saveDrmAllowIpChanges: (state) => {
      state.drmAllowIp.saveLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'save';
    },
    saveDrmAllowIpChangesSuccess: (state, action) => {
      state.drmAllowIp.saveLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;

      if (!state.detail.serviceDetail) {
        state.detail.serviceDetail = {};
      }
      state.detail.serviceDetail.drmAllowIps = action?.payload || [];
    },
    saveDrmAllowIpChangesFail: (state, action) => {
      state.drmAllowIp.saveLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || { code: 'SAVE_ERROR' };
    },

    resetDrmAllowIpResult: (state) => {
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = null;
    },
  },
});

export const {
  initState,
  updateField,

  // ... 기존 export

  fetchDrmAllowIpList,
  fetchDrmAllowIpListSuccess,
  fetchDrmAllowIpListFail,

  saveDrmAllowIpChanges,
  saveDrmAllowIpChangesSuccess,
  saveDrmAllowIpChangesFail,

  resetDrmAllowIpResult,
} = detailSlice.actions;

export default detailSlice.reducer;