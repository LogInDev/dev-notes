import { useEffect, useMemo, useState, useCallback } from 'react';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
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

const splitIntoColumns = (list, columnCount = 2) => {
  const cols = Array.from({ length: columnCount }, () => []);
  list.forEach((item, index) => {
    cols[index % columnCount].push({
      ...item,
      rowNo: index + 1, // [CHANGED] 전체 리스트 기준 순번
    });
  });
  return cols;
};

const buildDrmAllowIpPayload = (originalList, draftList) => {
  const normalizedOriginal = (originalList || []).map((item) => ({
    ipId: item.ipId,
    ip: normalize(item.ip),
    label: normalize(item.label),
  }));

  const normalizedDraft = (draftList || []).map((item) => ({
    ipId: item.isNew ? null : item.ipId,
    tempId: item.tempId,
    ip: normalize(item.ip),
    label: normalize(item.label),
    isNew: item.isNew === true,
  }));

  const createdList = normalizedDraft
    .filter((item) => item.isNew)
    .map((item) => ({
      ip: item.ip,
      label: item.label,
    }));

  const updatedList = normalizedDraft
    .filter((item) => !item.isNew && item.ipId != null)
    .filter((draftItem) => {
      const originItem = normalizedOriginal.find(
        (origin) => origin.ipId === draftItem.ipId,
      );

      return (
        originItem &&
        (originItem.ip !== draftItem.ip || originItem.label !== draftItem.label)
      );
    })
    .map((item) => ({
      ipId: item.ipId,
      ip: item.ip,
      label: item.label,
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

const createDraftRow = (ip, label) => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ipId: null,
  ip,
  label,
  isNew: true,
});

const DrmAllowIpSection = ({ svcId, isEditing, setIsEditing }) => {
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

  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState(''); // [CHANGED]
  const [draftAllowIps, setDraftAllowIps] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
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
        addToast(intlObj.get(message['store.success.applyAllowIp']), 'success');
        setIsEditing(false);
        setDraftAllowIps([]);
        setEditingId(null);
        setEditingValue('');
        setEditingLabel('');
        setNewIp('');
        setNewLabel('');
      }
      dispatch(resetDrmAllowIpResult());
    }

    if (error) {
      if (error.code === 'DUPLICATE') {
        addToast(intlObj.get(message['store.validation.duplicate']), 'warning');
      } else if (lastAction === 'fetch') {
        addToast(intlObj.get(message['store.error.fetchAllowIp']), 'error');
      } else if (lastAction === 'save') {
        addToast(intlObj.get(message['store.error.applyAllowIp']), 'error');
      }
      dispatch(resetDrmAllowIpResult());
    }
  }, [success, error, lastAction, dispatch, addToast, setIsEditing]);

  const validateIp = useCallback((value) => {
    const v = normalize(value);
    if (!v) {
      return {
        ok: false,
        msg: intlObj.get(message['store.validation.allowIpValue']),
      };
    }
    const ok = isValidIpv4(v) || isValidCidr(v);
    if (!ok) {
      return {
        ok: false,
        msg: intlObj.get(message['store.validation.allowIp']),
      };
    }
    return { ok: true };
  }, []);

  const validateLabel = useCallback((value) => {
    const v = normalize(value);
    if (!v) {
      return {
        ok: false,
        msg: intlObj.get(message['store.validation.allowIpLabel']) ||
          'Label을 입력해 주세요.',
      };
    }
    return { ok: true };
  }, []);

  const currentList = isEditing ? draftAllowIps : allowIps;

  const isDuplicateIp = useCallback(
    (value, excludeKey) => {
      const v = normalize(value);
      return currentList.some((item) => {
        const key = item.isNew ? item.tempId : item.ipId;
        return normalize(item.ip) === v && key !== excludeKey;
      });
    },
    [currentList],
  );

  const columns = useMemo(() => splitIntoColumns(currentList, 2), [currentList]);

  const startEditMode = () => {
    setDraftAllowIps(
      (allowIps || []).map((item) => ({
        ...item,
        label: item.label || '',
        isNew: false,
      })),
    );
    setIsEditing(true);
    setNewIp('');
    setNewLabel('');
    setEditingId(null);
    setEditingValue('');
    setEditingLabel('');
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    setDraftAllowIps([]);
    setNewIp('');
    setNewLabel('');
    setEditingId(null);
    setEditingValue('');
    setEditingLabel('');
  };

  const onAdd = useCallback(() => {
    const normalizedIp = normalize(newIp);
    const normalizedLabel = normalize(newLabel);

    const ipValid = validateIp(normalizedIp);
    if (!ipValid.ok) {
      addToast(ipValid.msg, 'warning');
      return;
    }

    const labelValid = validateLabel(normalizedLabel);
    if (!labelValid.ok) {
      addToast(labelValid.msg, 'warning');
      return;
    }

    if (isDuplicateIp(normalizedIp, null)) {
      addToast(
        intlObj.get(message['store.warning.alreadyRegisteredIp']),
        'warning',
      );
      return;
    }

    setDraftAllowIps((prev) => [
      ...prev,
      createDraftRow(normalizedIp, normalizedLabel),
    ]);
    setNewIp('');
    setNewLabel('');
  }, [newIp, newLabel, validateIp, validateLabel, isDuplicateIp, addToast]);

  const onStartEdit = useCallback((row) => {
    const rowKey = row.isNew ? row.tempId : row.ipId;
    setEditingId(rowKey);
    setEditingValue(row.ip || '');
    setEditingLabel(row.label || '');
  }, []);

  const onCancelRowEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
    setEditingLabel('');
  }, []);

  const onSaveRowEdit = useCallback(() => {
    const normalizedIp = normalize(editingValue);
    const normalizedLabel = normalize(editingLabel);

    const ipValid = validateIp(normalizedIp);
    if (!ipValid.ok) {
      addToast(ipValid.msg, 'warning');
      return;
    }

    const labelValid = validateLabel(normalizedLabel);
    if (!labelValid.ok) {
      addToast(labelValid.msg, 'warning');
      return;
    }

    if (isDuplicateIp(normalizedIp, editingId)) {
      addToast(
        intlObj.get(message['store.warning.alreadyRegisteredIp']),
        'warning',
      );
      return;
    }

    setDraftAllowIps((prev) =>
      prev.map((row) => {
        const rowKey = row.isNew ? row.tempId : row.ipId;
        if (rowKey !== editingId) return row;

        return {
          ...row,
          ip: normalizedIp,
          label: normalizedLabel,
        };
      }),
    );

    setEditingId(null);
    setEditingValue('');
    setEditingLabel('');
  }, [
    editingValue,
    editingLabel,
    editingId,
    validateIp,
    validateLabel,
    isDuplicateIp,
    addToast,
  ]);

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
      setEditingLabel('');
    }

    setDeleteConfirm({ open: false, row: null });
  }, [deleteConfirm, editingId]);

  const handleApply = () => {
    if (editingId) {
      addToast(intlObj.get(message['store.validation.pendingEdit']), 'warning');
      return;
    }

    const invalidIpRow = draftAllowIps.find((row) => !validateIp(row.ip).ok);
    if (invalidIpRow) {
      addToast(intlObj.get(message['store.validation.invalidIp']), 'warning');
      return;
    }

    const invalidLabelRow = draftAllowIps.find(
      (row) => !validateLabel(row.label).ok,
    );
    if (invalidLabelRow) {
      addToast(
        intlObj.get(message['store.validation.allowIpLabel']) ||
          'Label을 입력해 주세요.',
        'warning',
      );
      return;
    }

    const normalizedDraftIps = draftAllowIps.map((row) => normalize(row.ip));
    const hasDuplicateIp = normalizedDraftIps.some(
      (ip, idx) => normalizedDraftIps.indexOf(ip) !== idx,
    );
    if (hasDuplicateIp) {
      addToast(intlObj.get(message['store.validation.duplicate']), 'warning');
      return;
    }

    const diffPayload = buildDrmAllowIpPayload(allowIps, draftAllowIps);

    if (!hasDiff(diffPayload)) {
      addToast(intlObj.get(message['store.validation.noChanges']), 'warning');
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
    const isRowEditing = isEditing && editingId === rowKey;

    return (
      <div key={rowKey} style={{ padding: '10px 0' }}>
        <Division flex={true} gap={10} alignItems={'center'}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isRowEditing ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>{row.rowNo}</div>
                <div style={{ flex: 2 }}>
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div style={{ flex: 3 }}>
                  <Input
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ wordBreak: 'break-all', flex: 1 }}>
                  {row.rowNo}
                </div>
                <div style={{ wordBreak: 'break-all', flex: 2 }}>
                  {row.ip}
                </div>
                <div style={{ wordBreak: 'break-all', flex: 3 }}>
                  {row.label}
                </div>
              </div>
            )}
          </div>

          {isEditing &&
            (!isRowEditing ? (
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
        title={intlObj.get(message['store.manageAllowIp'])}
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
                {intlObj.get(message['store.cancel'])}
              </Buttons.Outlined>

              <Buttons.Outlined
                type={'primary'}
                onClick={handleApply}
                minWidth="80"
                disabled={saveLoading}
              >
                {intlObj.get(message['store.apply'])}
              </Buttons.Outlined>
            </Division>
          ) : (
            <Buttons.Outlined
              type={'grey'}
              onClick={startEditMode}
              minWidth="80"
              disabled={fetchLoading || saveLoading}
            >
              {intlObj.get(message['store.edit'])}
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
              placeholder={intlObj.get(message['store.placeholder.input.allowIp'])}
              maxLength={100}
              maxWidth={280}
            />
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={
                intlObj.get(message['store.placeholder.input.allowIpLabel']) ||
                'Label을 입력하세요.'
              }
              maxLength={100}
              maxWidth={280}
            />
            <Buttons.Outlined
              type={'grey'}
              onClick={onAdd}
              minWidth="80"
              disabled={saveLoading}
            >
              {intlObj.get(message['store.add'])}
            </Buttons.Outlined>
          </Division>
          <Divide top={10} bottom={0} $border={false} />
        </>
      )}

      {fetchLoading ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: '8px 0' }}>
          {intlObj.get(message['store.loading.searching'])}
        </div>
      ) : currentList.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: '8px 0' }}>
          {intlObj.get(message['store.noAllowIp'])}
        </div>
      ) : (
        <Division flex={true} gap={20} alignItems={'flex-start'}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginRight: '56px',
                    fontWeight: 600,
                    paddingBottom: '6px',
                  }}
                >
                  <div style={{ flex: 1 }}>No.</div>
                  <div style={{ flex: 2 }}>IP</div>
                  <div style={{ flex: 3 }}>Label</div>
                </div>
                {col.map(renderRow)}
              </div>
            </div>
          ))}
        </Division>
      )}

      <Confirm
        open={deleteConfirm.open}
        title={intlObj.get(message['store.confirm.title.allowIpDelete'])}
        desc={intlObj.get(message['store.confirm.desc.allowIpDelete'])}
        okText={intlObj.get(message['store.delete'])}
        cancelText={intlObj.get(message['store.cancel'])}
        onOk={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, row: null })}
      />
    </div>
  );
};

export default DrmAllowIpSection;