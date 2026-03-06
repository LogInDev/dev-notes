import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ContentHeader from "@/components/Organisms/ContentHeader";
import Division from "@/components/Atoms/Division";
import Buttons from "@/components/Atoms/Buttons";
import Input from "@/components/Atoms/Input";
import Divide from "@/components/Atoms/Divide";
import Confirm from "@/components/Atoms/Confirm";
import { useToast } from "@/utils/ToastProvider";
import {
  fetchDrmAllowIpList,
  addDrmAllowIp,
  updateDrmAllowIp,
  deleteDrmAllowIp,
  resetDrmAllowIpResult,
} from "@/store/reduxStore/detail/reducer";

const isValidIpv4 = (ip) => {
  const parts = (ip || "").trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
};

const isValidCidr = (value) => {
  const v = (value || "").trim();
  const [ip, mask] = v.split("/");
  if (!ip || mask === undefined) return false;
  if (!isValidIpv4(ip)) return false;
  if (!/^\d+$/.test(mask)) return false;
  const m = Number(mask);
  return m >= 0 && m <= 32;
};

const normalize = (v) => (v || "").trim();

/** ✅ 조회된 IP를 4단락(가로 4열)으로 분배 */
const splitIntoColumns = (list, columnCount = 4) => {
  const cols = Array.from({ length: columnCount }, () => []);
  list.forEach((item, index) => {
    cols[index % columnCount].push(item);
  });
  return cols;
};

const DrmAllowIpSection = ({ svcId }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const serviceDetail =
    useSelector((state) => state.get("detail"))?.detail?.serviceDetail || {};
  const allowIps = serviceDetail?.drmAllowIps || [];

  const drmAllowIpState =
    useSelector((state) => state.get("detail"))?.drmAllowIp || {};
  const fetchLoading = drmAllowIpState?.fetchLoading || false;
  const requestLoading = drmAllowIpState?.requestLoading || false;
  const success = drmAllowIpState?.success || false;
  const error = drmAllowIpState?.error;
  const lastAction = drmAllowIpState?.lastAction;

  const [newIp, setNewIp] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });

  const tempSeqRef = useRef(0);

  useEffect(() => {
    dispatch(fetchDrmAllowIpList({ svcId }));
  }, [svcId]);

  useEffect(() => {
    if (success) {
      if (lastAction === "add") addToast("허용 IP가 추가되었습니다.", "success");
      if (lastAction === "update") addToast("허용 IP가 수정되었습니다.", "success");
      if (lastAction === "delete") addToast("허용 IP가 삭제되었습니다.", "success");
      dispatch(resetDrmAllowIpResult());
    }
    if (error) {
      if (error.code === "DUPLICATE") {
        addToast("이미 등록된 허용 IP입니다.", "warning");
      } else {
        if (lastAction === "fetch") addToast("허용 IP 조회 중 오류가 발생했습니다.", "error");
        if (lastAction === "add") addToast("허용 IP 추가 중 오류가 발생했습니다.", "error");
        if (lastAction === "update") addToast("허용 IP 수정 중 오류가 발생했습니다.", "error");
        if (lastAction === "delete") addToast("허용 IP 삭제 중 오류가 발생했습니다.", "error");
      }
      dispatch(resetDrmAllowIpResult());
    }
  }, [success, error, lastAction]);

  const validate = useCallback((value) => {
    const v = normalize(value);
    if (!v) return { ok: false, msg: "허용 IP를 입력해 주세요." };
    const ok = isValidIpv4(v) || isValidCidr(v);
    if (!ok) return { ok: false, msg: "형식이 올바르지 않습니다. 예) 10.0.0.1 또는 10.0.0.0/25" };
    return { ok: true };
  }, []);

  const isDuplicate = useCallback(
    (value, excludeId) => {
      const v = normalize(value);
      return allowIps.some((x) => x.ip === v && x.id !== excludeId);
    },
    [allowIps],
  );

  const onAdd = useCallback(() => {
    const v = normalize(newIp);
    const valid = validate(v);
    if (!valid.ok) return addToast(valid.msg, "warning");
    if (isDuplicate(v)) return addToast("이미 등록된 허용 IP입니다.", "warning");

    tempSeqRef.current += 1;
    const tempId = `tmp-${Date.now()}-${tempSeqRef.current}`;

    dispatch(addDrmAllowIp({ svcId, ip: v, tempId }));
    setNewIp("");
  }, [newIp, svcId, validate, isDuplicate]);

  const onStartEdit = useCallback((row) => {
    setEditingId(row.id);
    setEditingValue(row.ip);
  }, []);

  const onCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue("");
  }, []);

  const onSaveEdit = useCallback(() => {
    const v = normalize(editingValue);
    const valid = validate(v);
    if (!valid.ok) return addToast(valid.msg, "warning");
    if (isDuplicate(v, editingId)) return addToast("이미 등록된 허용 IP입니다.", "warning");

    const prev = allowIps.find((r) => r.id === editingId)?.ip;

    dispatch(updateDrmAllowIp({ svcId, id: editingId, ip: v, prevIp: prev }));
    setEditingId(null);
    setEditingValue("");
  }, [editingValue, editingId, svcId, validate, isDuplicate, allowIps]);

  const openDelete = useCallback((row) => {
    setDeleteConfirm({ open: true, row });
  }, []);

  const confirmDelete = useCallback(() => {
    const row = deleteConfirm.row;
    if (!row?.id) return;

    dispatch(deleteDrmAllowIp({ svcId, id: row.id, backup: row }));

    if (editingId === row.id) onCancelEdit();
    setDeleteConfirm({ open: false, row: null });
  }, [deleteConfirm, svcId, editingId, onCancelEdit]);

  const canAdd = useMemo(() => {
    const v = normalize(newIp);
    if (!v) return false;
    if (!(isValidIpv4(v) || isValidCidr(v))) return false;
    if (isDuplicate(v)) return false;
    return true;
  }, [newIp, isDuplicate]);

  /** ✅ 4단락 데이터 */
  const columns = useMemo(() => splitIntoColumns(allowIps, 4), [allowIps]);

  const renderRow = (row) => {
    const isEditing = editingId === row.id;

    return (
      <div key={row.id} style={{ padding: "10px 0" }}>
        <Division flex={true} gap={10} alignItems={"center"}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                maxLength={100}
                maxWidth={220}
              />
            ) : (
              <div style={{ wordBreak: "break-all", opacity: row.isTemp ? 0.6 : 1 }}>
                {row.ip}
                {row.isTemp ? " (저장중...)" : ""}
              </div>
            )}
          </div>

          {!isEditing ? (
            <Division flex={true} gap={4} justifyContent={"center"}>
              <Buttons.IconEdit
                onClick={() => onStartEdit(row)}
                disabled={requestLoading || row.isTemp}
              />
              <Buttons.IconDeleteRed
                onClick={() => openDelete(row)}
                disabled={requestLoading || row.isTemp}
              />
            </Division>
          ) : (
            <Division flex={true} gap={4} justifyContent={"center"}>
              <Buttons.IconSave
                onClick={onSaveEdit}
                disabled={requestLoading}
              />
              <Buttons.IconCancel
                onClick={onCancelEdit}
                disabled={requestLoading}
              />
            </Division>
          )}
        </Division>

        {/* ✅ 전체 border X / row 값 있을 때만 아래 line */}
        <div style={{ borderBottom: "1px solid #DDDDDD", marginTop: 10 }} />
      </div>
    );
  };

  return (
    <div>
      <ContentHeader title="허용 IP 관리" $border={true} spacing={20} />

      <Division flex={true} gap={10} alignItems={"center"}>
        <Input
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          placeholder="허용 IP를 입력하세요. ( 예 : 10.0.0.0/25 )"
          maxLength={100}
          maxWidth={350}
        />
        <Buttons.Outlined
          type={"grey"}
          onClick={onAdd}
          minWidth="80"
          disabled={!canAdd || requestLoading}
        >
          추가
        </Buttons.Outlined>
      </Division>

      <Divide top={10} bottom={0} $border={false} />

      {fetchLoading ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: "8px 0" }}>조회 중...</div>
      ) : allowIps.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: "8px 0" }}>등록된 허용 IP가 없습니다.</div>
      ) : (
        /** ✅ 여기서 4단락 렌더링 */
        <Division flex={true} gap={20} alignItems={"flex-start"}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
              {col.map(renderRow)}
            </div>
          ))}
        </Division>
      )}

      <Confirm
        open={deleteConfirm.open}
        title={"허용 IP 삭제"}
        desc={"해당 허용 IP를 삭제하시겠습니까?"}
        okText={"삭제"}
        cancelText={"취소"}
        onOk={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, row: null })}
      />
    </div>
  );
};

export default DrmAllowIpSection;