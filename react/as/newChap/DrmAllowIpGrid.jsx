// src/components/Organisms/DrmAllowIpGrid.js
// pages/Api/Detail/detail/DrmAllowIpGrid.jsx
import { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import GridListEditor from '@/components/Organisms/GridListEditor';
import { useToast } from '@/utils/ToastProvider';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import {
  addDrmAllowIp,
  updateDrmAllowIp,
  deleteDrmAllowIp,
} from '@/store/reduxStore/detail/reducer';
import { isValidIpOrCidr, normalizeIpOrCidr } from '@/utils/ipUtils';

const DrmAllowIpGrid = ({ svcId, disabled = false }) => {
  const { addToast } = useToast();
  const dispatch = useDispatch();

  const detailPageState = useSelector((state) => state.get('detail')) || {};
  const drmState = detailPageState?.drm || {};

  const allowIpList = drmState?.allowIpList || [];
  const loadingAdd = drmState?.addAllowIpLoading || false;
  const loadingUpdate = drmState?.updateAllowIpLoading || false;
  const loadingDelete = drmState?.deleteAllowIpLoading || false;

  // 백엔드 데이터 구조: { allowIpId, ipCidr, ... }
  const items = useMemo(() => allowIpList, [allowIpList]);

  const validate = useCallback(
    (value) => {
      const v = (value || '').trim();
      if (!v) return { ok: false, message: 'IP를 입력해 주세요.' };

      if (!isValidIpOrCidr(v)) {
        return {
          ok: false,
          message:
            "형식이 올바르지 않습니다. 단일 IP(예: 10.0.0.1) 또는 CIDR(예: 10.0.0.0/25)만 허용합니다.",
        };
      }

      // 중복 1차 방어(클라)
      const exists = items.some(
        (it) => (it?.ipCidr || '').trim() === v,
      );
      if (exists) {
        return { ok: false, message: '이미 등록된 허용 IP입니다.' };
      }

      return { ok: true };
    },
    [items],
  );

  const onAdd = useCallback(
    (value) => {
      const normalized = normalizeIpOrCidr(value);
      const v = validate(normalized);
      if (!v.ok) {
        addToast(v.message, 'warning');
        return;
      }

      dispatch(
        addDrmAllowIp({
          svcId,
          ipCidr: normalized,
          addToast,
          toastSuccess: '허용 IP가 추가되었습니다.',
          toastError: '허용 IP 추가에 실패했습니다.',
          toastDuplicated: '이미 등록된 허용 IP입니다.',
        }),
      );
    },
    [dispatch, svcId, addToast, validate],
  );

  const onUpdate = useCallback(
    (item, newValue) => {
      const allowIpId = item?.allowIpId;
      const normalized = normalizeIpOrCidr(newValue);

      if (!allowIpId) {
        addToast('allowIpId가 없어 수정할 수 없습니다.', 'error');
        return;
      }

      if (!isValidIpOrCidr(normalized)) {
        addToast(
          "형식이 올바르지 않습니다. 단일 IP 또는 CIDR만 허용합니다.",
          'error',
        );
        return;
      }

      // 수정 시 중복 체크(자기 자신 제외)
      const exists = items.some(
        (it) =>
          it?.allowIpId !== allowIpId &&
          (it?.ipCidr || '').trim() === normalized,
      );
      if (exists) {
        addToast('이미 등록된 허용 IP입니다.', 'warning');
        return;
      }

      dispatch(
        updateDrmAllowIp({
          svcId,
          allowIpId,
          ipCidr: normalized,
          addToast,
          toastSuccess: '허용 IP가 수정되었습니다.',
          toastError: '허용 IP 수정에 실패했습니다.',
          toastDuplicated: '이미 등록된 허용 IP입니다.',
        }),
      );
    },
    [dispatch, svcId, addToast, items],
  );

  const onDelete = useCallback(
    (item) => {
      const allowIpId = item?.allowIpId;
      if (!allowIpId) {
        addToast('allowIpId가 없어 삭제할 수 없습니다.', 'error');
        return;
      }

      dispatch(
        deleteDrmAllowIp({
          svcId,
          allowIpId,
          addToast,
          toastSuccess: '허용 IP가 삭제되었습니다.',
          toastError: '허용 IP 삭제에 실패했습니다.',
        }),
      );
    },
    [dispatch, svcId, addToast],
  );

  return (
    <GridListEditor
      columnsCount={4}
      items={items}
      getKey={(item) => item.allowIpId}
      getLabel={(item) => item.ipCidr}
      placeholder="허용 IP를 입력하세요. (예: 10.0.0.0/25)"
      addButtonText={intlObj.get(message['store.add'])}
      validateInput={(value) => {
        const result = validate(value);
        // GridListEditor는 message를 화면에 직접 띄우지 않으니, 여기서 toast
        if (!result.ok) addToast(result.message, 'warning');
        return result;
      }}
      normalizeInput={normalizeIpOrCidr}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
      loadingAdd={loadingAdd}
      loadingUpdate={loadingUpdate}
      loadingDelete={loadingDelete}
      disabled={disabled}
    />
  );
};

export default DrmAllowIpGrid;