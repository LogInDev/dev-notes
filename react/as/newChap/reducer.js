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

  // ✅ DRM 영역(기존 유지)
  drm: {
    allowIpList: [],
    addAllowIpLoading: false,
    addAllowIpSuccess: false,
    updateAllowIpLoading: false,
    updateAllowIpSuccess: false,
    deleteAllowIpLoading: false,
    deleteAllowIpSuccess: false,

    // ✅ RootKey 상태는 drm에 둔다(기존 구조 유지)
    updateRootKeyLoading: false,
    updateRootKeySuccess: false,
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
      const payload = action?.payload || {};
      state.detail.serviceDetail = payload;
      state.detail.fetchServiceDetailSuccess = true;
      state.detail.fetchServiceDetailLoading = false;

      // ✅ DRM allowIpList는 serviceDetail payload에서 항상 동기화
      state.drm.allowIpList = payload?.drm?.allowIps || [];
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

    // =========================
    // ✅ DRM Allow IP (기존 유지)
    // =========================
    addDrmAllowIp: (state) => {
      state.drm.addAllowIpLoading = true;
      state.drm.addAllowIpSuccess = false;
    },
    addDrmAllowIpSuccess: (state) => {
      state.drm.addAllowIpLoading = false;
      state.drm.addAllowIpSuccess = true;
    },
    addDrmAllowIpFail: (state) => {
      state.drm.addAllowIpLoading = false;
    },

    updateDrmAllowIp: (state) => {
      state.drm.updateAllowIpLoading = true;
      state.drm.updateAllowIpSuccess = false;
    },
    updateDrmAllowIpSuccess: (state) => {
      state.drm.updateAllowIpLoading = false;
      state.drm.updateAllowIpSuccess = true;
    },
    updateDrmAllowIpFail: (state) => {
      state.drm.updateAllowIpLoading = false;
    },

    deleteDrmAllowIp: (state) => {
      state.drm.deleteAllowIpLoading = true;
      state.drm.deleteAllowIpSuccess = false;
    },
    deleteDrmAllowIpSuccess: (state) => {
      state.drm.deleteAllowIpLoading = false;
      state.drm.deleteAllowIpSuccess = true;
    },
    deleteDrmAllowIpFail: (state) => {
      state.drm.deleteAllowIpLoading = false;
    },

    // =========================
    // ✅ [ADD] DRM RootKey Update
    // =========================
    updateDrmRootKey: (state) => {
      state.drm.updateRootKeyLoading = true;
      state.drm.updateRootKeySuccess = false;
    },
    updateDrmRootKeySuccess: (state, action) => {
      state.drm.updateRootKeyLoading = false;
      state.drm.updateRootKeySuccess = true;

      // ✅ 화면 즉시 반영 (fetchServiceDetail 재조회도 하지만, 즉시 반영해 UX 좋게)
      const nextRootKey = action?.payload?.rootKey;
      if (nextRootKey !== undefined) {
        state.detail.serviceDetail = {
          ...(state.detail.serviceDetail || {}),
          rootKey: nextRootKey,
        };
      }
    },
    updateDrmRootKeyFail: (state) => {
      state.drm.updateRootKeyLoading = false;
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
  addDrmAllowIp,
  addDrmAllowIpSuccess,
  addDrmAllowIpFail,
  updateDrmAllowIp,
  updateDrmAllowIpSuccess,
  updateDrmAllowIpFail,
  deleteDrmAllowIp,
  deleteDrmAllowIpSuccess,
  deleteDrmAllowIpFail,

  // ✅ [ADD]
  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
} = detailSlice.actions;

export default detailSlice.reducer;