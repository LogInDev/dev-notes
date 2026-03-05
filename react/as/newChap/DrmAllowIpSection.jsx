import { useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { produce } from "immer";

import ContentHeader from "@/components/Organisms/ContentHeader";
import Division from "@/components/Atoms/Division";
import Input from "@/components/Atoms/Input";
import Buttons from "@/components/Atoms/Buttons";
import Divide from "@/components/Atoms/Divide";
import Confirm from "@/components/Atoms/Confirm";
import { useToast } from "@/utils/ToastProvider";

// ✅ 프로젝트 구조 유지: detail slice에 action 추가해서 쓰는 형태 권장
// 예시 action명 (너 프로젝트에 맞게 reducer/saga에 추가)
import {
  fetchDrmAllowIpList,
  addDrmAllowIp,
  updateDrmAllowIp,
  deleteDrmAllowIp,
} from "@/store/reduxStore/detail/reducer";

/** CIDR 또는 단일 IPv4 허용 */
const isValidIpOrCidr = (value) => {
  const v = (value || "").trim();
  if (!v) return false;

  // 단일 IPv4
  const ipv4 =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  // CIDR (0~32)
  const cidr =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\/(3[0-2]|[12]?\d)$/;

  return ipv4.test(v) || cidr.test(v);
};

/** 4단 가로 배치: 추가 시 좌->우 라운드로빈 분배 */
const splitIntoColumns = (list, colCount = 4) => {
  const cols = Array.from({ length: colCount }, () => []);
  list.forEach((item, idx) => {
    cols[idx % colCount].push(item);
  });
  return cols;
};

const defaultConfirm = {
  open: false,
  title: "",
  desc: "",
  okText: "",
  cancelText: "",
  onOk: () => {},
  onCancel: () => {},
  hideCancel: false,
};

const DrmAllowIpSection = ({ svcId }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  // ✅ detailState에서 allowIp 목록 가져오는 방식 (프로젝트 구조 유지)
  const detailState = useSelector((state) => state.get("detail"))?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};

  // ✅ allowIp 리스트는 서버 스펙에 맞게 배열로 내려오는 걸 가정
  // 예: serviceDetail.drmAllowIps = [{ id, ip }]
  const allowIpList = serviceDetail?.drmAllowIps || [];

  // ✅ 로딩은 detail slice에 상태 추가 권장
  const drmAllowIpState = useSelector((state) => state.get("detail"))?.drmAllowIp || {};
  const fetchLoading = drmAllowIpState?.fetchLoading || false;
  const requestLoading = drmAllowIpState?.requestLoading || false;

  const [newIp, setNewIp] = useState("");
  const [editingId, setEditingId] = useState(null); // ✅ 한 번에 한 줄만 수정
  const [editDraftById, setEditDraftById] = useState({}); // ✅ id별 draft
  const [confirm, setConfirm] = useState(defaultConfirm);

  // 최초 조회 필요하면 useEffect에서 호출
  // useEffect(() => { dispatch(fetchDrmAllowIpList({ svcId })); }, [svcId]);

  const columns = useMemo(() => splitIntoColumns(allowIpList, 4), [allowIpList]);

  const closeConfirm = () => setConfirm(defaultConfirm);

  const handleAdd = useCallback(() => {
    const value = (newIp || "").trim();
    if (!value) {
      addToast("허용 IP를 입력해 주세요.", "warning");
      return;
    }
    if (!isValidIpOrCidr(value)) {
      addToast("IP 형식이 올바르지 않습니다. (예: 10.0.0.1 또는 10.0.0.0/25)", "error");
      return;
    }
    const duplicated = allowIpList.some((x) => (x.ip || "").trim() === value);
    if (duplicated) {
      addToast("이미 등록된 IP입니다.", "warning");
      return;
    }

    // ✅ Confirm 없이 바로 추가할지, Confirm을 넣을지 정책 선택 가능
    dispatch(addDrmAllowIp({ svcId, ip: value }));
    setNewIp("");
  }, [newIp, allowIpList, dispatch, svcId, addToast]);

  const startEdit = useCallback((row) => {
    setEditingId(row.id);
    setEditDraftById((prev) => ({ ...prev, [row.id]: row.ip || "" }));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraftById({});
  }, []);

  const saveEdit = useCallback(() => {
    const id = editingId;
    const draft = (editDraftById[id] || "").trim();

    if (!id) return;
    if (!draft) {
      addToast("IP를 입력해 주세요.", "warning");
      return;
    }
    if (!isValidIpOrCidr(draft)) {
      addToast("IP 형식이 올바르지 않습니다. (예: 10.0.0.1 또는 10.0.0.0/25)", "error");
      return;
    }
    const duplicated = allowIpList.some((x) => x.id !== id && (x.ip || "").trim() === draft);
    if (duplicated) {
      addToast("이미 등록된 IP입니다.", "warning");
      return;
    }

    dispatch(updateDrmAllowIp({ svcId, id, ip: draft }));
    cancelEdit();
  }, [editingId, editDraftById, dispatch, svcId, allowIpList, cancelEdit, addToast]);

  const askDelete = useCallback((row) => {
    setConfirm({
      open: true,
      title: "허용 IP 삭제",
      desc: "해당 IP를 삭제할까요?",
      okText: "삭제",
      cancelText: "취소",
      onOk: () => {
        dispatch(deleteDrmAllowIp({ svcId, id: row.id }));
        closeConfirm();
        // 삭제 중 편집 상태면 정리
        if (editingId === row.id) cancelEdit();
      },
      onCancel: () => closeConfirm(),
    });
  }, [dispatch, svcId, editingId, cancelEdit]);

  const renderRow = (row) => {
    const isEditing = editingId === row.id;
    const draftValue = editDraftById[row.id] ?? "";

    return (
      <div key={row.id}>
        <Division
          flex={true}
          gap={10}
          alignItems={"center"}
          justifyContent={"space-between"}
          // ✅ 값 있을 때만 아래 라인
          style={{
            padding: "8px 0",
            borderBottom: row?.ip ? "1px solid #dddddd" : "none",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <Input
                value={draftValue}
                onChange={(e) =>
                  setEditDraftById((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
                placeholder="예: 10.0.0.1 또는 10.0.0.0/25"
                maxLength={100}
                maxWidth={260}
              />
            ) : (
              <div style={{ wordBreak: "break-all", fontSize: 13, opacity: 0.9 }}>
                {row.ip}
              </div>
            )}
          </div>

          <Division flex={true} gap={6} alignItems={"center"}>
            {isEditing ? (
              <>
                <Buttons.IconSave
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEdit();
                  }}
                />
                <Buttons.IconCancel
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEdit();
                  }}
                />
              </>
            ) : (
              <>
                <Buttons.IconEdit
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(row);
                  }}
                />
                <Buttons.IconDeleteRed
                  onClick={(e) => {
                    e.stopPropagation();
                    askDelete(row);
                  }}
                />
              </>
            )}
          </Division>
        </Division>
      </div>
    );
  };

  return (
    <div>
      <ContentHeader title="허용 IP 관리" $border={true} spacing={20} />

      {/* ✅ 상단 Input + 추가 버튼: 4단 테이블 전체 위에 1개 */}
      <Division flex={true} gap={10} alignItems={"center"}>
        <Input
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          placeholder="허용 IP를 입력하세요. (예: 10.0.0.1 또는 10.0.0.0/25)"
          maxLength={100}
          maxWidth={350}
        />
        <Buttons.Outlined
          type={"grey"}
          onClick={handleAdd}
          minWidth="80"
          disabled={requestLoading}
        >
          추가
        </Buttons.Outlined>
      </Division>

      <Divide top={10} bottom={0} $border={false} />

      {/* ✅ 4단 가로 배치 */}
      <Division flex={true} gap={20} alignItems={"flex-start"}>
        {columns.map((colRows, idx) => (
          <div key={idx} style={{ flex: 1, minWidth: 0 }}>
            {colRows.map(renderRow)}
          </div>
        ))}
      </Division>

      <Confirm
        open={confirm.open}
        title={confirm.title}
        desc={confirm.desc}
        okText={confirm.okText}
        cancelText={confirm.cancelText}
        hideCancel={confirm.hideCancel}
        onOk={confirm.onOk}
        onCancel={confirm.onCancel}
      />
    </div>
  );
};

export default DrmAllowIpSection;
