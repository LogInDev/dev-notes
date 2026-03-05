// store/reduxStore/detail/reducer.js
import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
  permission: {
    subscriptionPermission: 'NON', // NOR: 권한 존재, APR: 권한 승인 대기, NON: 권한 없음
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

  // =========================
  // [CHANGED] DRM RootKey update 상태
  // =========================
  updateRootKeyLoading: false,
  updateRootKeySuccess: false,

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
    initState: () => {
      return initialState;
    },
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

    // =========================
    // [CHANGED] RootKey 수정
    // =========================
    updateRootKey: (state) => {
      state.updateRootKeyLoading = true;
      state.updateRootKeySuccess = false;
    },
    updateRootKeySuccess: (state, action) => {
      state.updateRootKeyLoading = false;
      state.updateRootKeySuccess = true;

      // 화면 즉시 반영 (serviceDetail에 rootKey 갱신)
      const nextRootKey = action?.payload?.rootKey;
      if (nextRootKey !== undefined) {
        state.detail.serviceDetail = {
          ...(state.detail.serviceDetail || {}),
          rootKey: nextRootKey,
        };
      }
    },
    updateRootKeyFail: (state) => {
      state.updateRootKeyLoading = false;
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

  // [CHANGED]
  updateRootKey,
  updateRootKeySuccess,
  updateRootKeyFail,

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
} = detailSlice.actions;

export default detailSlice.reducer;