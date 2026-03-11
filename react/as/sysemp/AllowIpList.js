import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';
import Input from '@/components/Atoms/Input';
import Divide from '@/components/Atoms/Divide';
import Confirm from '@/components/Atoms/Confirm';
import { useToast } from '@/utils/ToastProvider';
import {
  fetchDrmAllowIpList,
  saveDrmAllowIpChanges,
  resetDrmAllowIpResult,
} from '@/store/reduxStore/detail/reducer';

const isValidIpv4 = (ip) => {
  const parts = (ip || '').trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
};

const isValidCidr = (value) => {
  const v = (value || '').trim();
  const [ip, mask] = v.split('/');
  if (!ip || mask === undefined) return false;
  if (!isValidIpv4(ip)) return false;
  if (!/^\d+$/.test(mask)) return false;
  const m = Number(mask);
  return m >= 0 && m <= 32;
};

const normalize = (v) => (v || '').trim();

const splitIntoColumns = (list, columnCount = 4) => {
  const cols = Array.from({ length: columnCount }, () => []);
  list.forEach((item, index) => {
    cols[index % columnCount].push(item);
  });
  return cols;
};

const buildDrmAllowIpPayload = (originalList, draftList) => {
  const normalizedOriginal = (originalList || []).map((item) => ({
    ipId: item.ipId,
    ip: normalize(item.ip),
  }));

  const normalizedDraft = (draftList || []).map((item) => ({
    ipId: item.isNew ? null : item.ipId,
    tempId: item.tempId,
    ip: normalize(item.ip),
    isNew: item.isNew === true,
  }));

  const createdList = normalizedDraft
    .filter((item) => item.isNew)
    .map((item) => ({
      ip: item.ip,
    }));

  const updatedList = normalizedDraft
    .filter((item) => !item.isNew && item.ipId != null)
    .filter((draftItem) => {
      const originItem = normalizedOriginal.find(
        (origin) => origin.ipId === draftItem.ipId,
      );
      return originItem && originItem.ip !== draftItem.ip;
    })
    .map((item) => ({
      ipId: item.ipId,
      ip: item.ip,
    }));

  const deletedList = normalizedOriginal
    .filter((originItem) => {
      return !normalizedDraft.some(
        (draftItem) =>
          draftItem.isNew !== true && draftItem.ipId === originItem.ipId,
      );
    })
    .map((item) => ({
      ipId: item.ipId,
    }));

  return {
    createdList,
    updatedList,
    deletedList,
  };
};

const hasDiff = ({ createdList, updatedList, deletedList }) => {
  return (
    createdList.length > 0 ||
    updatedList.length > 0 ||
    deletedList.length > 0
  );
};

const createDraftRow = (ip) => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ipId: null,
  ip,
  isNew: true,
});

const DrmAllowIpSection = ({ svcId }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const serviceDetail =
    useSelector((state) => state.get('detail'))?.detail?.serviceDetail || {};
  const allowIps = serviceDetail?.drmAllowIps || [];

  const drmAllowIpState =
    useSelector((state) => state.get('detail'))?.drmAllowIp || {};
  const fetchLoading = drmAllowIpState?.fetchLoading || false;
  const saveLoading = drmAllowIpState?.saveLoading || false;
  const success = drmAllowIpState?.success || false;
  const error = drmAllowIpState?.error;
  const lastAction = drmAllowIpState?.lastAction;

  const [isEditing, setIsEditing] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [draftAllowIps, setDraftAllowIps] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    row: null,
  });

  useEffect(() => {
    dispatch(fetchDrmAllowIpList({ svcId }));
  }, [svcId, dispatch]);

  useEffect(() => {
    if (success) {
      if (lastAction === 'save') {
        addToast('허용 IP가 적용되었습니다.', 'success');
        setIsEditing(false);
        setDraftAllowIps([]);
        setEditingId(null);
        setEditingValue('');
        setNewIp('');
      }
      dispatch(resetDrmAllowIpResult());
    }

    if (error) {
      if (error.code === 'DUPLICATE') {
        addToast('중복된 허용 IP가 있습니다.', 'warning');
      } else if (lastAction === 'fetch') {
        addToast('허용 IP 조회 중 오류가 발생했습니다.', 'error');
      } else if (lastAction === 'save') {
        addToast('허용 IP 적용 중 오류가 발생했습니다.', 'error');
      }
      dispatch(resetDrmAllowIpResult());
    }
  }, [success, error, lastAction, dispatch, addToast]);

  const validate = useCallback((value) => {
    const v = normalize(value);
    if (!v) return { ok: false, msg: '허용 IP를 입력해 주세요.' };
    const ok = isValidIpv4(v) || isValidCidr(v);
    if (!ok) {
      return {
        ok: false,
        msg: '형식이 올바르지 않습니다. 예) 10.0.0.1 또는 10.0.0.0/25',
      };
    }
    return { ok: true };
  }, []);

  const currentList = isEditing ? draftAllowIps : allowIps;

  const isDuplicate = useCallback(
    (value, excludeKey) => {
      const v = normalize(value);
      return currentList.some((item) => {
        const key = item.isNew ? item.tempId : item.ipId;
        return normalize(item.ip) === v && key !== excludeKey;
      });
    },
    [currentList],
  );

  const columns = useMemo(() => splitIntoColumns(currentList, 4), [currentList]);

  const startEditMode = () => {
    setDraftAllowIps(
      (allowIps || []).map((item) => ({
        ...item,
        isNew: false,
      })),
    );
    setIsEditing(true);
    setNewIp('');
    setEditingId(null);
    setEditingValue('');
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    setDraftAllowIps([]);
    setNewIp('');
    setEditingId(null);
    setEditingValue('');
  };

  const onAdd = useCallback(() => {
    const v = normalize(newIp);
    const valid = validate(v);
    if (!valid.ok) {
      addToast(valid.msg, 'warning');
      return;
    }

    if (isDuplicate(v, null)) {
      addToast('이미 등록된 허용 IP입니다.', 'warning');
      return;
    }

    setDraftAllowIps((prev) => [...prev, createDraftRow(v)]);
    setNewIp('');
  }, [newIp, validate, isDuplicate, addToast]);

  const onStartEdit = useCallback((row) => {
    const rowKey = row.isNew ? row.tempId : row.ipId;
    setEditingId(rowKey);
    setEditingValue(row.ip);
  }, []);

  const onCancelRowEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const onSaveRowEdit = useCallback(() => {
    const v = normalize(editingValue);
    const valid = validate(v);
    if (!valid.ok) {
      addToast(valid.msg, 'warning');
      return;
    }

    if (isDuplicate(v, editingId)) {
      addToast('이미 등록된 허용 IP입니다.', 'warning');
      return;
    }

    setDraftAllowIps((prev) =>
      prev.map((row) => {
        const rowKey = row.isNew ? row.tempId : row.ipId;
        if (rowKey !== editingId) return row;
        return {
          ...row,
          ip: v,
        };
      }),
    );

    setEditingId(null);
    setEditingValue('');
  }, [editingValue, editingId, validate, isDuplicate, addToast]);

  const openDelete = useCallback((row) => {
    setDeleteConfirm({ open: true, row });
  }, []);

  const confirmDelete = useCallback(() => {
    const row = deleteConfirm.row;
    if (!row) return;

    const rowKey = row.isNew ? row.tempId : row.ipId;

    setDraftAllowIps((prev) =>
      prev.filter((item) => {
        const itemKey = item.isNew ? item.tempId : item.ipId;
        return itemKey !== rowKey;
      }),
    );

    if (editingId === rowKey) {
      setEditingId(null);
      setEditingValue('');
    }

    setDeleteConfirm({ open: false, row: null });
  }, [deleteConfirm, editingId]);

  const handleApply = () => {
    if (editingId) {
      addToast('편집 중인 IP를 먼저 저장 또는 취소해 주세요.', 'warning');
      return;
    }

    const invalidRow = draftAllowIps.find((row) => !validate(row.ip).ok);
    if (invalidRow) {
      addToast('유효하지 않은 허용 IP가 있습니다.', 'warning');
      return;
    }

    const normalizedDraft = draftAllowIps.map((row) => normalize(row.ip));
    const hasDuplicateIp = normalizedDraft.some(
      (ip, idx) => normalizedDraft.indexOf(ip) !== idx,
    );
    if (hasDuplicateIp) {
      addToast('중복된 허용 IP가 있습니다.', 'warning');
      return;
    }

    const diffPayload = buildDrmAllowIpPayload(allowIps, draftAllowIps);

    if (!hasDiff(diffPayload)) {
      addToast('변경된 내용이 없습니다.', 'warning');
      setIsEditing(false);
      setDraftAllowIps([]);
      return;
    }

    dispatch(
      saveDrmAllowIpChanges({
        svcId,
        ...diffPayload,
      }),
    );
  };

  const renderRow = (row) => {
    const rowKey = row.isNew ? row.tempId : row.ipId;
    const isIpEditing = isEditing && editingId === rowKey;

    return (
      <div key={rowKey} style={{ padding: '10px 0' }}>
        <Division flex={true} gap={10} alignItems={'center'}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isIpEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                maxLength={100}
                maxWidth={220}
              />
            ) : (
              <div style={{ wordBreak: 'break-all' }}>{row.ip}</div>
            )}
          </div>

          {isEditing &&
            (!isIpEditing ? (
              <Division flex={true} gap={4} justifyContent={'center'}>
                <Buttons.IconEdit onClick={() => onStartEdit(row)} />
                <Buttons.IconDeleteRed onClick={() => openDelete(row)} />
              </Division>
            ) : (
              <Division flex={true} gap={4} justifyContent={'center'}>
                <Buttons.IconSave onClick={onSaveRowEdit} disabled={saveLoading} />
                <Buttons.IconCancel
                  onClick={onCancelRowEdit}
                  disabled={saveLoading}
                />
              </Division>
            ))}
        </Division>

        <div style={{ borderBottom: '1px solid #DDDDDD', marginTop: 10 }} />
      </div>
    );
  };

  return (
    <div>
      <ContentHeader
        title="허용 IP 관리"
        $border={true}
        spacing={20}
        extraContent={
          isEditing ? (
            <Division flex={true} gap={8} alignItems={'center'}>
              <Buttons.Outlined
                type={'grey'}
                onClick={cancelEditMode}
                minWidth="80"
                disabled={saveLoading}
              >
                취소
              </Buttons.Outlined>

              <Buttons.Outlined
                type={'primary'}
                onClick={handleApply}
                minWidth="80"
                disabled={saveLoading}
              >
                적용하기
              </Buttons.Outlined>
            </Division>
          ) : (
            <Buttons.Outlined
              type={'grey'}
              onClick={startEditMode}
              minWidth="80"
              disabled={fetchLoading || saveLoading}
            >
              수정하기
            </Buttons.Outlined>
          )
        }
      />

      <Divide top={10} bottom={0} $border={false} />

      {isEditing && (
        <>
          <Division flex={true} gap={10} alignItems={'center'}>
            <Input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="허용 IP를 입력하세요. ( 예 : 10.0.0.0/25 )"
              maxLength={100}
              maxWidth={350}
            />
            <Buttons.Outlined
              type={'grey'}
              onClick={onAdd}
              minWidth="80"
              disabled={saveLoading}
            >
              추가
            </Buttons.Outlined>
          </Division>
          <Divide top={10} bottom={0} $border={false} />
        </>
      )}

      {fetchLoading ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: '8px 0' }}>
          조회 중...
        </div>
      ) : currentList.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: '8px 0' }}>
          등록된 허용 IP가 없습니다.
        </div>
      ) : (
        <Division flex={true} gap={20} alignItems={'flex-start'}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
              {col.map(renderRow)}
            </div>
          ))}
        </Division>
      )}

      <Confirm
        open={deleteConfirm.open}
        title={'허용 IP 삭제'}
        desc={'해당 허용 IP를 삭제하시겠습니까?'}
        okText={'삭제'}
        cancelText={'취소'}
        onOk={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, row: null })}
      />
    </div>
  );
};

export default DrmAllowIpSection;