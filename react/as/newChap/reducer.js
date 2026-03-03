// ✅ initialState에 추가
const initialState = {
  // ... 기존 state들

  drm: {
    rootKey: null, // 마스킹된 rootKey or null
    allowIpList: [], // [{ id, ipCidr, createdAt, updatedAt }]

    fetchDrmConfigLoading: false,
    fetchDrmConfigSuccess: false,

    empNo: '',
    empNoStatus: 'idle', // idle | checking | valid | duplicated | invalid
    verifyEmpNoLoading: false,

    upsertAllowIpLoading: false,
    deleteAllowIpLoading: false,
  },
};

// ✅ reducers에 추가
reducers: {
  // ... 기존 reducers

  fetchDrmConfig: (state) => {
    state.drm.fetchDrmConfigLoading = true;
    state.drm.fetchDrmConfigSuccess = false;
  },
  fetchDrmConfigSuccess: (state, action) => {
    state.drm.fetchDrmConfigLoading = false;
    state.drm.fetchDrmConfigSuccess = true;
    state.drm.rootKey = action?.payload?.rootKey ?? null;
    state.drm.allowIpList = action?.payload?.allowIpList || [];
  },
  fetchDrmConfigFail: (state) => {
    state.drm.fetchDrmConfigLoading = false;
  },

  verifyDrmEmpNo: (state, action) => {
    state.drm.verifyEmpNoLoading = true;
    state.drm.empNoStatus = 'checking';
    state.drm.empNo = action?.payload?.empNo || state.drm.empNo;
  },
  verifyDrmEmpNoSuccess: (state, action) => {
    state.drm.verifyEmpNoLoading = false;
    state.drm.empNoStatus = action?.payload?.status || 'invalid';
    state.drm.empNo = action?.payload?.empNo || state.drm.empNo;
  },
  verifyDrmEmpNoFail: (state) => {
    state.drm.verifyEmpNoLoading = false;
    state.drm.empNoStatus = 'invalid';
  },

  upsertDrmAllowIp: (state) => {
    state.drm.upsertAllowIpLoading = true;
  },
  upsertDrmAllowIpSuccess: (state, action) => {
    state.drm.upsertAllowIpLoading = false;
    // ✅ 서버 최신 리스트로 덮어쓰기(동기화 버그 최소)
    state.drm.allowIpList = action?.payload?.allowIpList || state.drm.allowIpList;
  },
  upsertDrmAllowIpFail: (state) => {
    state.drm.upsertAllowIpLoading = false;
  },

  deleteDrmAllowIp: (state) => {
    state.drm.deleteAllowIpLoading = true;
  },
  deleteDrmAllowIpSuccess: (state, action) => {
    state.drm.deleteAllowIpLoading = false;
    state.drm.allowIpList = action?.payload?.allowIpList || state.drm.allowIpList;
  },
  deleteDrmAllowIpFail: (state) => {
    state.drm.deleteAllowIpLoading = false;
  },
}

// ✅ actions export에 추가
export const {
  // ... 기존 exports
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
} = detailSlice.actions;
