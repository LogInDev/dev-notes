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
  saveDrmAllowIpList,
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

// 원본/드래프트 비교용
const toComparableList = (list) =>
  (list || [])
    .map((item) => normalize(item.ip))
    .filter(Boolean);

const isSameIpList = (originList, draftList) => {
  const origin = toComparableList(originList);
  const draft = toComparableList(draftList);

  if (origin.length !== draft.length) return false;
  return origin.every((value, idx) => value === draft[idx]);
};

const createDraftRow = (ip) => ({
  ipId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

  // ✅ 수정모드 전용 로컬 draft
  const [draftAllowIps, setDraftAllowIps] = useState([]);

  // ✅ 현재 편집 중인 row 1개만 관리
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
        setEditingId(null);
        setEditingValue('');
      }
      dispatch(resetDrmAllowIpResult());
    }

    if (error) {
      if (error.code === 'DUPLICATE') {
        addToast('중복된 허용 IP가 있습니다.', 'warning');
      } else {
        if (lastAction === 'fetch') {
          addToast('허용 IP 조회 중 오류가 발생했습니다.', 'error');
        }
        if (lastAction === 'save') {
          addToast('허용 IP 적용 중 오류가 발생했습니다.', 'error');
        }
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
    (value, excludeId) => {
      const v = normalize(value);
      return currentList.some(
        (item) => normalize(item.ip) === v && item.ipId !== excludeId,
      );
    },
    [currentList],
  );

  const columns = useMemo(() => splitIntoColumns(currentList, 4), [currentList]);

  const startEditMode = () => {
    // ✅ 수정 시작 시 원본을 draft로 복사
    setDraftAllowIps(
      (allowIps || []).map((item) => ({
        ...item,
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

    if (isDuplicate(v)) {
      addToast('이미 등록된 허용 IP입니다.', 'warning');
      return;
    }

    setDraftAllowIps((prev) => [...prev, createDraftRow(v)]);
    setNewIp('');
  }, [newIp, validate, isDuplicate, addToast]);

  const onStartEdit = useCallback((row) => {
    setEditingId(row.ipId);
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
      prev.map((row) =>
        row.ipId === editingId
          ? {
              ...row,
              ip: v,
            }
          : row,
      ),
    );

    setEditingId(null);
    setEditingValue('');
  }, [editingValue, editingId, validate, isDuplicate, addToast]);

  const openDelete = useCallback((row) => {
    setDeleteConfirm({ open: true, row });
  }, []);

  const confirmDelete = useCallback(() => {
    const row = deleteConfirm.row;
    if (!row?.ipId) return;

    setDraftAllowIps((prev) => prev.filter((item) => item.ipId !== row.ipId));

    if (editingId === row.ipId) {
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
    const hasDuplicate = normalizedDraft.some(
      (ip, idx) => normalizedDraft.indexOf(ip) !== idx,
    );
    if (hasDuplicate) {
      addToast('중복된 허용 IP가 있습니다.', 'warning');
      return;
    }

    // ✅ 실무 판단: 변경 없으면 API 요청하지 않음
    if (isSameIpList(allowIps, draftAllowIps)) {
      addToast('변경된 내용이 없습니다.', 'warning');
      setIsEditing(false);
      setDraftAllowIps([]);
      return;
    }

    dispatch(
      saveDrmAllowIpList({
        svcId,
        allowIps: draftAllowIps.map((row, sortOrder) => ({
          ipId: row.isNew ? null : row.ipId,
          ip: normalize(row.ip),
          sortOrder,
        })),
      }),
    );
  };

  const renderRow = (row) => {
    const isIpEditing = isEditing && editingId === row.ipId;

    return (
      <div key={row.ipId} style={{ padding: '10px 0' }}>
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

          {isEditing && (
            <>
              {!isIpEditing ? (
                <Division flex={true} gap={4} justifyContent={'center'}>
                  <Buttons.IconEdit onClick={() => onStartEdit(row)} />
                  <Buttons.IconDeleteRed onClick={() => openDelete(row)} />
                </Division>
              ) : (
                <Division flex={true} gap={4} justifyContent={'center'}>
                  <Buttons.IconSave
                    onClick={onSaveRowEdit}
                    disabled={saveLoading}
                  />
                  <Buttons.IconCancel
                    onClick={onCancelRowEdit}
                    disabled={saveLoading}
                  />
                </Division>
              )}
            </>
          )}
        </Division>

        {/* ✅ 값이 있는 row만 아래 선 */}
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