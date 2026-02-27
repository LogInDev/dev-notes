// Total.jsx (변경된 부분만이 아니라, 수정된 함수 전체 코드)
// ✅ [DRM][CHANGED] DRM 서비스는 Total에서 구독 신청 버튼 클릭 시 Detail로 이동

import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
/* ... 기존 import 동일 ... */

const Total = ({
  searchTerm,
  searchedTerm,
  useSortBy,
  useSelectedCategories,
}) => {
  /* ... 기존 코드 동일 ... */

  const handleNavigateToDetail = (id) => {
    if (id) {
      navigate(`${getRoutePath(basename, '/api/detail/' + id)}`);
    }
  };

  // ✅ [DRM][CHANGED] 구독 버튼 클릭 시 핸들링
  const handleClickSubscribe = useCallback(
    (svcId, apiList) => {
      // svcType을 serviceList에서 찾는다(추가 상태 만들지 않고 기존 데이터 활용)
      const svcType = serviceList.find((s) => s.svcId === svcId)?.svcType;

      // ✅ DRM이면 Total에서 구독 플로우 진행하지 않고, Detail로 이동
      // (성능/구조: DRM 검증 UI는 Detail에만 두고 한 곳에서 관리)
      if (svcType === 'DRM') {
        addToast(
          "DRM 서비스는 상세 화면에서 '시스템 계정 사번' 유효성 확인 후 구독 신청 가능합니다.",
          'info',
        );
        handleNavigateToDetail(svcId);
        return;
      }

      const checkedApiList = apiList.filter(
        (api) => api.isChecked === true && api.subStat !== 'NOR',
      );

      if (serviceSubscriptionPermission === 'NON') {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(message['store.validation.noPermission']);
          }),
        );
      } else if (serviceSubscriptionPermission === 'APR') {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(
              message['store.warning.isPendingReqPermission'],
            );
          }),
        );
      } else if (checkedApiList.length > 0) {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(message['store.confirm.reqSub']);
            draft.onConfirm = () => {
              requestSubscribe(svcId, selectedKey?.keyId, checkedApiList);
            };
            draft.hideCancel = false;
          }),
        );
      } else {
        setSubscribeConfirm(
          produce(subscribeConfirm, (draft) => {
            draft.open = true;
            draft.desc = intlObj.get(
              message['store.validation.notSelectSubApi'],
            );
          }),
        );
      }
    },
    [
      serviceList, // ✅ [DRM][CHANGED] svcType 판단에 필요
      serviceSubscriptionPermission,
      subscribeConfirm,
      selectedKey,
      requestSubscribe,
      intlObj,
      message,
      addToast, // ✅ [DRM][CHANGED]
    ],
  );

  /* ... 나머지 기존 코드 동일 ... */
};