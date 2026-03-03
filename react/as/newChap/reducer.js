// detail/reducer.js
import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  permission: {
    subscriptionPermission: 'NON',
    fetchPermissionLoading: false,
    fetchPermissionSuccess: false,
  },
  detail: {
    serviceDetail: {},
    fetchServiceDetailLoading: false,
    fetchServiceDetailSuccess: false,
  },

  // ✅ [CHANGED] DRM 설정/허용IP 상태 추가
  drm: {
    rootKey: null, // 서버에서 마스킹된 값 또는 null
    empNo: '', // 마지막 입력값 보관(선택)
    empNoStatus: 'idle', // idle | checking | valid | duplicated | invalid
    allowIpList: [], // [{ id, ipCidr, createdAt, updatedAt }]
    fetchDrmConfigLoading: false,
    fetchDrmConfigSuccess: false,
    verifyEmpNoLoading: false,
    upsertAllowIpLoading: false,
    deleteAllowIpLoading: false,
  },

  list: {
    apiList: [],
    checkedList: [],
    fetchApiListLoading: false,
    fetchApiListSuccess: false,
  },
  manager: {
    managerList: [],
    fetchManagerListLoading: false,
    fetchManagerListSuccess: false,
  },
  history: {
    historyList: [],
    fetchHistoryListLoading: false,
    fetchHistoryListSuccess: false,
    updateLoading: false,
    updateSuccess: false,
  },
  requestSubscriptionPermissionLoading: false,
  requestSubscriptionPermissionSuccess: false,
  requestSubscribeLoading: false,
  requestSubscribeSuccess: false,
  cancelSubscribeLoading: false,
  cancelSubscribeSuccess: false,
  reserveDeleteServiceLoading: false,
  reserveDeleteServiceSuccess: false,
  cancelDeleteReserveLoading: false,
  cancelDeleteReserveSuccess: false,
};

const detailSlice = createSlice({
  name: 'detail',
  initialState,
  reducers: {
    initState: () => initialState,
    updateField: (state, action) => {
      const { field, value } = action.payload;
      set(state, field, value);
    },

    increaseViewCount: () => {},

    fetchSubscriptionPermission: (state) => {
      state.permission.fetchPermissionLoading = true;
    },
    fetchSubscriptionPermissionSuccess: (state, action) => {
      state.permission.subscriptionPermission = action?.payload || 'NON';
      state.permission.fetchPermissionSuccess = true;
      state.permission.fetchPermissionLoading = false;
    },
    fetchSubscriptionPermissionFail: (state) => {
      state.permission.fetchPermissionLoading = false;
    },

    fetchServiceDetail: (state) => {
      state.detail.fetchServiceDetailLoading = true;
    },
    fetchServiceDetailSuccess: (state, action) => {
      state.detail.serviceDetail = action?.payload || {};
      state.detail.fetchServiceDetailSuccess = true;
      state.detail.fetchServiceDetailLoading = false;
    },
    fetchServiceDetailFail: (state) => {
      state.detail.fetchServiceDetailLoading = false;
    },

    fetchApiList: (state) => {
      state.list.fetchApiListLoading = true;
    },
    fetchApiListSuccess: (state, action) => {
      state.list.apiList = action?.payload?.apiList || [];
      state.list.checkedList = action?.payload?.checkedList || [];
      state.list.fetchApiListSuccess = true;
      state.list.fetchApiListLoading = false;
    },
    fetchApiListFail: (state) => {
      state.list.fetchApiListLoading = false;
    },

    fetchManagerList: (state) => {
      state.manager.fetchManagerListLoading = true;
    },
    fetchManagerListSuccess: (state, action) => {
      state.manager.managerList = action?.payload || [];
      state.manager.fetchManagerListSuccess = true;
      state.manager.fetchManagerListLoading = false;
    },
    fetchManagerListFail: (state) => {
      state.manager.fetchManagerListLoading = false;
    },

    fetchHistoryList: (state) => {
      state.history.fetchHistoryListLoading = true;
    },
    fetchHistoryListSuccess: (state, action) => {
      state.history.historyList = action?.payload || [];
      state.history.fetchHistoryListSuccess = true;
      state.history.fetchHistoryListLoading = false;
    },
    fetchHistoryListFail: (state) => {
      state.history.fetchHistoryListLoading = false;
    },

    updateHistory: (state) => {
      state.history.updateLoading = true;
      state.history.updateSuccess = false;
    },
    updateHistorySuccess: (state) => {
      state.history.updateLoading = false;
      state.history.updateSuccess = true;
    },
    updateHistoryFail: (state) => {
      state.history.updateLoading = false;
    },

    requestSubscriptionPermission: (state) => {
      state.requestSubscriptionPermissionLoading = true;
    },
    requestSubscriptionPermissionSuccess: (state) => {
      state.requestSubscriptionPermissionLoading = false;
      state.requestSubscriptionPermissionSuccess = true;
    },
    requestSubscriptionPermissionFail: (state) => {
      state.requestSubscriptionPermissionLoading = false;
    },

    requestSubscribe: (state) => {
      state.requestSubscribeLoading = true;
    },
    requestSubscribeSuccess: (state) => {
      state.requestSubscribeLoading = false;
      state.requestSubscribeSuccess = true;
    },
    requestSubscribeFail: (state) => {
      state.requestSubscribeLoading = false;
    },

    cancelSubscribe: (state) => {
      state.cancelSubscribeLoading = true;
    },
    cancelSubscribeSuccess: (state) => {
      state.cancelSubscribeLoading = false;
      state.cancelSubscribeSuccess = true;
    },
    cancelSubscribeFail: (state) => {
      state.cancelSubscribeLoading = false;
    },

    reserveDeleteService: (state) => {
      state.reserveDeleteServiceLoading = true;
    },
    reserveDeleteServiceSuccess: (state) => {
      state.reserveDeleteServiceLoading = false;
      state.reserveDeleteServiceSuccess = true;
    },
    reserveDeleteServiceFail: (state) => {
      state.reserveDeleteServiceLoading = false;
    },

    cancelDeleteReserve: (state) => {
      state.cancelDeleteReserveLoading = true;
    },
    cancelDeleteReserveSuccess: (state) => {
      state.cancelDeleteReserveLoading = false;
      state.cancelDeleteReserveSuccess = true;
    },
    cancelDeleteReserveFail: (state) => {
      state.cancelDeleteReserveLoading = false;
    },

    // =========================================================
    // ✅ [CHANGED] DRM actions
    // =========================================================

    fetchDrmConfig: (state) => {
      state.drm.fetchDrmConfigLoading = true;
      state.drm.fetchDrmConfigSuccess = false;
    },
    fetchDrmConfigSuccess: (state, action) => {
      state.drm.fetchDrmConfigLoading = false;
      state.drm.fetchDrmConfigSuccess = true;
      state.drm.rootKey = action?.payload?.rootKey ?? null;
      state.drm.allowIpList = action?.payload?.allowIpList || [];
      // empNoStatus는 화면 입력 흐름이므로 유지
    },
    fetchDrmConfigFail: (state) => {
      state.drm.fetchDrmConfigLoading = false;
    },

    verifyDrmEmpNo: (state) => {
      state.drm.verifyEmpNoLoading = true;
      state.drm.empNoStatus = 'checking';
    },
    verifyDrmEmpNoSuccess: (state, action) => {
      state.drm.verifyEmpNoLoading = false;
      state.drm.empNoStatus = action?.payload?.status || 'idle'; // valid/duplicated/invalid
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
      // 서버가 최신 리스트를 주는 방식이 버그 최소(동기화)
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
  },
});

export const {
  initState,
  updateField,
  increaseViewCount,
  fetchSubscriptionPermission,
  fetchSubscriptionPermissionSuccess,
  fetchSubscriptionPermissionFail,
  fetchServiceDetail,
  fetchServiceDetailSuccess,
  fetchServiceDetailFail,
  fetchApiList,
  fetchManagerList,
  fetchManagerListSuccess,
  fetchManagerListFail,
  fetchApiListSuccess,
  fetchApiListFail,
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

  // ✅ DRM exports
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

export default detailSlice.reducer;
