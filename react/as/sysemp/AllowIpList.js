import { useEffect, useMemo, useState, useCallback } from "react";
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
  saveDrmAllowIpList,
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

const createDraftRow = (row = {}) => ({
  ipId: row.ipId || row.id || null,
  ip: row.ip || "",
  tempKey: row.tempKey || `tmp-${Date.now()}-${Math.random()}`,
});

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

  const [isEditMode, setIsEditMode] = useState(false);
  const [draftIps, setDraftIps] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    targetIndex: null,
  });

  useEffect(() => {
    dispatch(fetchDrmAllowIpList({ svcId }));
  }, [dispatch, svcId]);

  useEffect(() => {
    if (success) {
      if (lastAction === "save") {
        addToast("허용 IP가 적용되었습니다.", "success");
        setIsEditMode(false);
        dispatch(fetchDrmAllowIpList({ svcId }));
      }
      dispatch(resetDrmAllowIpResult());
    }

    if (error) {
      if (error.code === "DUPLICATE") {
        addToast("중복된 허용 IP가 있습니다.", "warning");
      } else {
        addToast("허용 IP 적용 중 오류가 발생했습니다.", "error");
      }
      dispatch(resetDrmAllowIpResult());
    }
  }, [success, error, lastAction, dispatch, svcId, addToast]);

  const startEditMode = useCallback(() => {
    const nextDraft = (allowIps || []).map((row) => createDraftRow(row));
    setDraftIps(nextDraft);
    setIsEditMode(true);
  }, [allowIps]);

  const cancelEditMode = useCallback(() => {
    setDraftIps([]);
    setIsEditMode(false);
    setDeleteConfirm({ open: false, targetIndex: null });
  }, []);

  const handleChangeDraftIp = useCallback((index, value) => {
    setDraftIps((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, ip: value } : row
      )
    );
  }, []);

  const handleAddDraftIp = useCallback(() => {
    setDraftIps((prev) => [...prev, createDraftRow()]);
  }, []);

  const handleOpenDeleteConfirm = useCallback((index) => {
    setDeleteConfirm({
      open: true,
      targetIndex: index,
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const { targetIndex } = deleteConfirm;
    if (targetIndex === null || targetIndex === undefined) {
      setDeleteConfirm({ open: false, targetIndex: null });
      return;
    }

    setDraftIps((prev) => prev.filter((_, idx) => idx !== targetIndex));
    setDeleteConfirm({ open: false, targetIndex: null });
  }, [deleteConfirm]);

  const validateDraftIps = useCallback(() => {
    const normalizedList = draftIps.map((row) => normalize(row.ip));

    if (normalizedList.length === 0) {
      return { ok: false, msg: "허용 IP를 1개 이상 입력해 주세요." };
    }

    for (let i = 0; i < normalizedList.length; i += 1) {
      const value = normalizedList[i];

      if (!value) {
        return { ok: false, msg: `${i + 1}번째 허용 IP를 입력해 주세요.` };
      }

      const valid = isValidIpv4(value) || isValidCidr(value);
      if (!valid) {
        return {
          ok: false,
          msg: `${i + 1}번째 IP 형식이 올바르지 않습니다. 예) 10.0.0.1 또는 10.0.0.0/25`,
        };
      }
    }

    const uniqueCount = new Set(normalizedList).size;
    if (uniqueCount !== normalizedList.length) {
      return { ok: false, msg: "중복된 허용 IP가 있습니다." };
    }

    return {
      ok: true,
      values: normalizedList,
    };
  }, [draftIps]);

  const handleApply = useCallback(() => {
    const valid = validateDraftIps();

    if (!valid.ok) {
      addToast(valid.msg, "warning");
      return;
    }

    dispatch(
      saveDrmAllowIpList({
        svcId,
        allowIps: valid.values,
      })
    );
  }, [dispatch, svcId, validateDraftIps, addToast]);

  const columns = useMemo(() => splitIntoColumns(allowIps, 4), [allowIps]);
  const draftColumns = useMemo(() => splitIntoColumns(draftIps, 4), [draftIps]);

  const renderViewRow = (row) => {
    const key = row.ipId || row.id || row.ip;

    return (
      <div key={key} style={{ padding: "10px 0" }}>
        <div style={{ wordBreak: "break-all" }}>{row.ip}</div>
        <div style={{ borderBottom: "1px solid #DDDDDD", marginTop: 10 }} />
      </div>
    );
  };

  const renderEditRow = (row, index) => {
    const key = row.tempKey || row.ipId || index;

    return (
      <div key={key} style={{ padding: "10px 0" }}>
        <Division flex={true} gap={10} alignItems={"center"}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              value={row.ip}
              onChange={(e) => handleChangeDraftIp(index, e.target.value)}
              maxLength={100}
              placeholder="허용 IP를 입력하세요. (예: 10.0.0.1 또는 10.0.0.0/25)"
              maxWidth={260}
            />
          </div>

          <Buttons.Outlined
            type={"grey"}
            minWidth="60"
            onClick={() => handleOpenDeleteConfirm(index)}
            disabled={requestLoading}
          >
            삭제
          </Buttons.Outlined>
        </Division>

        <div style={{ borderBottom: "1px solid #DDDDDD", marginTop: 10 }} />
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
          isEditMode ? (
            <Division flex={true} gap={8} alignItems={"center"}>
              <Buttons.Outlined
                type={"grey"}
                onClick={handleAddDraftIp}
                minWidth="80"
                disabled={requestLoading}
              >
                추가하기
              </Buttons.Outlined>

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

      {fetchLoading ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: "8px 0" }}>
          조회 중...
        </div>
      ) : isEditMode ? (
        draftIps.length === 0 ? (
          <div>
            <Division flex={true} gap={10} alignItems={"center"}>
              <Input
                value=""
                onChange={() => {}}
                placeholder="추가하기 버튼으로 허용 IP를 입력해 주세요."
                maxWidth={350}
                disabled
              />
            </Division>

            <div style={{ fontSize: 13, opacity: 0.7, padding: "12px 0 0" }}>
              등록된 허용 IP가 없습니다. 추가하기를 눌러 입력해 주세요.
            </div>
          </div>
        ) : (
          <Division flex={true} gap={20} alignItems={"flex-start"}>
            {draftColumns.map((col, colIdx) => (
              <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
                {col.map((row, innerIdx) => {
                  const actualIndex = draftIps.findIndex(
                    (target) => target.tempKey === row.tempKey
                  );
                  return renderEditRow(row, actualIndex === -1 ? innerIdx : actualIndex);
                })}
              </div>
            ))}
          </Division>
        )
      ) : allowIps.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.7, padding: "8px 0" }}>
          등록된 허용 IP가 없습니다.
        </div>
      ) : (
        <Division flex={true} gap={20} alignItems={"flex-start"}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
              {col.map(renderViewRow)}
            </div>
          ))}
        </Division>
      )}

      <Confirm
        open={deleteConfirm.open}
        title={"허용 IP 삭제"}
        desc={"해당 허용 IP 입력란을 삭제하시겠습니까?"}
        okText={"삭제"}
        cancelText={"취소"}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, targetIndex: null })}
      />
    </div>
  );
};

export default DrmAllowIpSection;