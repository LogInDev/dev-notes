// detail/reducer.js
// detail/reducer.js 내 추가/수정

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
    // ... 기존 reducers

    // =========================
    // DRM Allow IP 조회
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
    // DRM Allow IP 일괄 저장
    // =========================
    saveDrmAllowIpList: (state) => {
      state.drmAllowIp.saveLoading = true;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = 'save';
    },
    saveDrmAllowIpListSuccess: (state, action) => {
      state.drmAllowIp.saveLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;

      if (!state.detail.serviceDetail) {
        state.detail.serviceDetail = {};
      }
      state.detail.serviceDetail.drmAllowIps = action?.payload || [];
    },
    saveDrmAllowIpListFail: (state, action) => {
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
  // ... 기존 export

  fetchDrmAllowIpList,
  fetchDrmAllowIpListSuccess,
  fetchDrmAllowIpListFail,

  saveDrmAllowIpList,
  saveDrmAllowIpListSuccess,
  saveDrmAllowIpListFail,

  resetDrmAllowIpResult,
} = detailSlice.actions;

export default detailSlice.reducer;