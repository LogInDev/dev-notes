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
    requestLoading: false,
    success: false,
    error: null,
    lastAction: null,
  },

  drmRootKey: {
    updateLoading: false,
    success: false,
    error: null,
  },

  // [DRM][CHANGED]
  drmEmpNo: {
    // 선택된 key 기준 현재 상태 조회
    infoLoading: false,
    infoSuccess: false,
    infoError: null,
    info: null,
    /**
     * 예시:
     * {
     *   authCd: 'SYS',
     *   subscriptionStatus: 'APR' | 'NOR' | 'NON' | null,
     *   systemEmpNoSection: {
     *     visible: true,
     *     editable: false,
     *     value: '20240001',
     *     validationRequired: false,
     *     subscriptionRequestEnabled: false,
     *     message: '승인 대기 중인 시스템 사번입니다.'
     *   }
     * }
     */

    // 유효성 검사
    verifyLoading: false,
    success: false,
    error: null,
    result: null,

    // 구독 신청
    subscribeLoading: false,
    subscribeSuccess: false,
    subscribeError: null,
  },
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

    fetchDrmAllowIpList: (state) => {
      state.drmAllowIp.fetchLoading = true;
      state.drmAllowIp.lastAction = 'fetch';
      state.drmAllowIp.error = null;
      state.drmAllowIp.success = false;
    },
    fetchDrmAllowIpListSuccess: (state) => {
      state.drmAllowIp.fetchLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    fetchDrmAllowIpListFail: (state, action) => {
      state.drmAllowIp.fetchLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || { code: 'FETCH_ERROR' };
    },

    addDrmAllowIp: (state) => {
      state.drmAllowIp.requestLoading = true;
      state.drmAllowIp.lastAction = 'add';
      state.drmAllowIp.error = null;
      state.drmAllowIp.success = false;
    },
    addDrmAllowIpSuccess: (state) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    addDrmAllowIpFail: (state, action) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || { code: 'ADD_ERROR' };
    },

    updateDrmAllowIp: (state) => {
      state.drmAllowIp.requestLoading = true;
      state.drmAllowIp.lastAction = 'update';
      state.drmAllowIp.error = null;
      state.drmAllowIp.success = false;
    },
    updateDrmAllowIpSuccess: (state) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    updateDrmAllowIpFail: (state, action) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || { code: 'UPDATE_ERROR' };
    },

    deleteDrmAllowIp: (state) => {
      state.drmAllowIp.requestLoading = true;
      state.drmAllowIp.lastAction = 'delete';
      state.drmAllowIp.error = null;
      state.drmAllowIp.success = false;
    },
    deleteDrmAllowIpSuccess: (state) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = true;
      state.drmAllowIp.error = null;
    },
    deleteDrmAllowIpFail: (state, action) => {
      state.drmAllowIp.requestLoading = false;
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = action?.payload || { code: 'DELETE_ERROR' };
    },

    resetDrmAllowIpResult: (state) => {
      state.drmAllowIp.success = false;
      state.drmAllowIp.error = null;
      state.drmAllowIp.lastAction = null;
    },

    setDrmAllowIps: (state, action) => {
      const list = action?.payload || [];
      if (!state.detail.serviceDetail) state.detail.serviceDetail = {};
      state.detail.serviceDetail.drmAllowIps = list;
    },
    addDrmAllowIpLocal: (state, action) => {
      const item = action?.payload;
      if (!item) return;
      if (!state.detail.serviceDetail) state.detail.serviceDetail = {};
      const prev = state.detail.serviceDetail.drmAllowIps || [];
      state.detail.serviceDetail.drmAllowIps = [...prev, item];
    },
    updateDrmAllowIpLocal: (state, action) => {
      const { id, ip } = action?.payload || {};
      if (!id) return;
      const prev = state.detail.serviceDetail?.drmAllowIps || [];
      state.detail.serviceDetail.drmAllowIps = prev.map((v) =>
        v.id === id ? { ...v, ip } : v,
      );
    },
    deleteDrmAllowIpLocal: (state, action) => {
      const id = action?.payload;
      if (!id) return;
      const prev = state.detail.serviceDetail?.drmAllowIps || [];
      state.detail.serviceDetail.drmAllowIps = prev.filter((v) => v.id !== id);
    },
    replaceTempDrmAllowIp: (state, action) => {
      const { tempId, item } = action?.payload || {};
      if (!tempId || !item?.id) return;
      const prev = state.detail.serviceDetail?.drmAllowIps || [];
      state.detail.serviceDetail.drmAllowIps = prev.map((v) =>
        v.id === tempId ? item : v,
      );
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

    // [DRM][NEW] 선택 key 기준 시스템 사번 정보 조회
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

    // [DRM][NEW] 시스템 사번 구독 신청
    requestDrmSubscribe: (state) => {
      state.drmEmpNo.subscribeLoading = true;
      state.drmEmpNo.subscribeSuccess = false;
      state.drmEmpNo.subscribeError = null;
    },
    requestDrmSubscribeSuccess: (state) => {
      state.drmEmpNo.subscribeLoading = false;
      state.drmEmpNo.subscribeSuccess = true;
      state.drmEmpNo.subscribeError = null;
    },
    requestDrmSubscribeFail: (state, action) => {
      state.drmEmpNo.subscribeLoading = false;
      state.drmEmpNo.subscribeSuccess = false;
      state.drmEmpNo.subscribeError =
        action?.payload || { code: 'DRM_SUBSCRIBE_ERROR' };
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
  fetchApiListSuccess,
  fetchApiListFail,
  fetchManagerList,
  fetchManagerListSuccess,
  fetchManagerListFail,
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

  setDrmAllowIps,
  addDrmAllowIpLocal,
  updateDrmAllowIpLocal,
  deleteDrmAllowIpLocal,
  replaceTempDrmAllowIp,

  updateDrmRootKey,
  updateDrmRootKeySuccess,
  updateDrmRootKeyFail,
  resetDrmRootKeyResult,

  // [DRM][NEW]
  fetchDrmEmpNoInfo,
  fetchDrmEmpNoInfoSuccess,
  fetchDrmEmpNoInfoFail,
  verifyDrmEmpNo,
  verifyDrmEmpNoSuccess,
  verifyDrmEmpNoFail,
  requestDrmSubscribe,
  requestDrmSubscribeSuccess,
  requestDrmSubscribeFail,
  resetDrmEmpNoResult,
} = detailSlice.actions;

export default detailSlice.reducer;
