
이거 로직을 바꿀꺼야. '수정하기'버튼을 누르면 input란과 '추가'버튼이 보이고 input 란에 ip 적고 '추가'버튼을 누르면 아래 ip리스트에 div로 추가가되는거야
그리고 수정하기 모드에서 ip리스트들은 div로 보이고 
해당 row에 IconEdit 버튼 누르면 해당 row는 input란으로 되면서 isIpEditing이 true 모가 되고 
IconsSave 버튼 누르면 해당 row는 div로 되고 input에 적힌 ip가 표시되고 IconCancel을 누르면 이전에 입력됨 ip가 div로 보이
'적용하기'버튼 누르면 전체 확정된 ip들이 api로 요청되게 해서 db에 업데이트 하도록
적용하는거야.
근데 바뀐에 없으면 api 요청 안하도록 하는게 좋을 까?
그건 너의 실무판단에 맡길게


reducer랑 saga도 수정해줘


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

  const [isEditing, setIsEditing] = useState(false);
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
    setEditingId(row.ipId);
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
    if (!row?.ipId) return;

    dispatch(deleteDrmAllowIp({ svcId, id: row.ipId, backup: row }));

    if (editingId === row.ipId) onCancelEdit();
    setDeleteConfirm({ open: false, row: null });
  }, [deleteConfirm, svcId, editingId, onCancelEdit]);

  const columns = useMemo(() => splitIntoColumns(allowIps, 4), [allowIps]);

  const renderRow = (row) => {
    const isIpEditing = editingId === row.ipId;
    return (
      <div key={row.ipId} style={{ padding: "10px 0" }}>
        <Division flex={true} gap={10} alignItems={"center"}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isIpEditing ? (
              <Input
                value={row.ip}
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

          {!isIpEditing ? (
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

        <div style={{ borderBottom: "1px solid #DDDDDD", marginTop: 10 }} />
      </div>
    );
  };

  const startEditMode = () => {
    setIsEditing(true)
  }
  const cancelEditMode = () => {
    setIsEditing(false)
  }
  const handleApply = () => {
    setIsEditing(false)
  }

  return (
    <div>
      <ContentHeader
        title="허용 IP 관리"
        $border={true}
        spacing={20}
        extraContent={
          isEditing ? (
            <Division flex={true} gap={8} alignItems={"center"}>
              {/* <Buttons.Outlined
                type={"grey"}
                onClick={handleAddDraftIp}
                minWidth="80"
                disabled={requestLoading}
              >
                추가하기
              </Buttons.Outlined> */}

              <Buttons.Outlined
                type={"grey"}
                onClick={cancelEditMode}
                minWidth="80"
                disabled={requestLoading}
              >
                취소
              </Buttons.Outlined>

              <Buttons.Outlined
                type={"primary"}
                onClick={handleApply}
                minWidth="80"
                disabled={requestLoading}
              >
                적용하기
              </Buttons.Outlined>
            </Division>
          ) : (
            <Buttons.Outlined
              type={"grey"}
              onClick={startEditMode}
              minWidth="80"
              disabled={fetchLoading || requestLoading}
            >
              수정하기
            </Buttons.Outlined>
          )
        }
      />

      <Divide top={10} bottom={0} $border={false} />

        {isEditing && (
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
          disabled={requestLoading}
        >
          추가
        </Buttons.Outlined>
      </Division>
        )}
      <Divide top={10} bottom={0} $border={false} />

      {fetchLoading ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: "8px 0" }}>조회 중...</div>
      ) : allowIps.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: "8px 0" }}>등록된 허용 IP가 없습니다.</div>
      ) : (
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
