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
  drmAllowIp: {
    fetchLoading: false,
    saveLoading: false,
    success: false,
    error: null, 
    lastAction: null, // 'fetch' | 'save'
  },
  drmRootKey: {
    updateLoading: false,
    success: false,
    error: null,
  },
  drmEmpNo: {
    infoLoading: false,
    infoSuccess: false,
    infoError: null,
    info: null,
    verifyLoading: false,
    success: false,
    error: null,
    result: null, // { empNo, status } status: VALID|DUPLICATED|INVALID
    subscribeLoading: false,
    subscribeSuccess: false,
    subscribeError: null,
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
    updateDrmRootKey: (state) => {
      state.drmRootKey.updateLoading = true;
      state.drmRootKey.success = false;
      state.drmRootKey.error = null;
    },
    updateDrmRootKeySuccess: (state, action) => {
      state.drmRootKey.updateLoading = false;
      state.drmRootKey.success = true;
      state.drmRootKey.error = null;
      const newKey = action?.payload?.rootKey;
      if (newKey !== undefined) {
        if (!state.detail.serviceDetail) state.detail.serviceDetail = {};
        state.detail.serviceDetail.rootKey = newKey;
      }
    },
    updateDrmRootKeyFail: (state, action) => {
      state.drmRootKey.updateLoading = false;
      state.drmRootKey.success = false;
      state.drmRootKey.error = action?.payload || { code: 'ROOTKEY_UPDATE_ERROR' };
    },
    resetDrmRootKeyResult: (state) => {
      state.drmRootKey.success = false;
      state.drmRootKey.error = null;
    },
    fetchDrmEmpNoInfo: (state) => {
      state.drmEmpNo.infoLoading = true;
      state.drmEmpNo.infoSuccess = false;
      state.drmEmpNo.infoError = null;
      state.drmEmpNo.info = null;

      state.drmEmpNo.verifyLoading = false;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = null;
      state.drmEmpNo.result = null;

      state.drmEmpNo.subscribeLoading = false;
      state.drmEmpNo.subscribeSuccess = false;
      state.drmEmpNo.subscribeError = null;
    },
    fetchDrmEmpNoInfoSuccess: (state, action) => {
      state.drmEmpNo.infoLoading = false;
      state.drmEmpNo.infoSuccess = true;
      state.drmEmpNo.infoError = null;
      state.drmEmpNo.info = action?.payload || null;
    },
    fetchDrmEmpNoInfoFail: (state, action) => {
      state.drmEmpNo.infoLoading = false;
      state.drmEmpNo.infoSuccess = false;
      state.drmEmpNo.infoError = action?.payload || { code: 'EMPNO_INFO_ERROR' };
      state.drmEmpNo.info = null;
    },
    verifyDrmEmpNo: (state) => {
      state.drmEmpNo.verifyLoading = true;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = null;
      state.drmEmpNo.result = null;
    },
    verifyDrmEmpNoSuccess: (state, action) => {
      console.log('verifyDrm============', action?.payload)
      state.drmEmpNo.verifyLoading = false;
      state.drmEmpNo.success = true;
      state.drmEmpNo.error = null;
      state.drmEmpNo.result = action?.payload || null;
    },
    verifyDrmEmpNoFail: (state, action) => {
      state.drmEmpNo.verifyLoading = false;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = action?.payload || { code: 'EMPNO_VERIFY_ERROR' };
    },
    resetDrmEmpNoResult: (state) => {
      state.drmEmpNo.verifyLoading = false;
      state.drmEmpNo.success = false;
      state.drmEmpNo.error = null;
      state.drmEmpNo.result = null;
      state.drmEmpNo.subscribeLoading = false;
      state.drmEmpNo.subscribeSuccess = false;
      state.drmEmpNo.subscribeError = null;
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
  fetchDrmAllowIpList,
  fetchDrmAllowIpListSuccess,
  fetchDrmAllowIpListFail,
  saveDrmAllowIpChanges,
  saveDrmAllowIpChangesSuccess,
  saveDrmAllowIpChangesFail,
  resetDrmAllowIpResult,
  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
  resetDrmRootKeyResult,
  fetchDrmEmpNoInfo,
  fetchDrmEmpNoInfoSuccess,
  fetchDrmEmpNoInfoFail,
  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,
  resetDrmEmpNoResult,
} = detailSlice.actions;
export default detailSlice.reducer;
