import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import ContentHeader from "@/components/Organisms/ContentHeader";
import Division from "@/components/Atoms/Division";
import Buttons from "@/components/Atoms/Buttons";
import Input from "@/components/Atoms/Input";
import Divide from "@/components/Atoms/Divide";
import { useToast } from "@/utils/ToastProvider";
import {
  updateDrmRootKey,
  resetDrmRootKeyResult,
} from "@/store/reduxStore/detail/reducer";

const DrmRootKeySection = ({ svcId }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const detailState = useSelector((state) => state.get("detail"))?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const rootKey = serviceDetail?.rootKey || "";

  const drmRootKeyState = useSelector((state) => state.get("detail"))?.drmRootKey || {};
  const updating = drmRootKeyState?.updating || false;
  const updateSuccess = drmRootKeyState?.updateSuccess || false;
  const updateError = drmRootKeyState?.updateError;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (isEditing) setDraft(rootKey);
  }, [isEditing, rootKey]);

  // ✅ toast는 컴포넌트에서만
  useEffect(() => {
    if (updateSuccess) {
      addToast("Root Key가 수정되었습니다.", "success");
      dispatch(resetDrmRootKeyResult());
      setIsEditing(false);
    }
    if (updateError) {
      addToast("Root Key 수정 중 오류가 발생했습니다.", "error");
      dispatch(resetDrmRootKeyResult());
    }
  }, [updateSuccess, updateError]);

  const canSave = useMemo(() => {
    const v = (draft || "").trim();
    return v.length > 0 && v !== (rootKey || "").trim();
  }, [draft, rootKey]);

  const onCopy = useCallback(async () => {
    if (!rootKey) return;
    try {
      await navigator.clipboard.writeText(rootKey);
      addToast("Root Key를 복사했습니다.", "success");
    } catch {
      addToast("Root Key 복사에 실패했습니다.", "error");
    }
  }, [rootKey]);

  const onSave = useCallback(() => {
    if (!canSave) return;
    dispatch(updateDrmRootKey({ svcId, rootKey: draft.trim() }));
  }, [canSave, draft, svcId]);

  return (
    <div>
      <ContentHeader $border={true} title="Root Key" spacing={20} />

      <Division flex={true} gap={10} alignItems={"center"}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Root Key 입력"
              maxLength={300}
            />
          ) : (
            <div style={{ wordBreak: "break-all", opacity: 0.9 }}>
              {rootKey || "-"}
            </div>
          )}
        </div>

        {!isEditing ? (
          <>
            <Buttons.Outlined type={"grey"} onClick={onCopy} minWidth="80">
              복사
            </Buttons.Outlined>
            <Buttons.Outlined
              type={"grey"}
              onClick={() => setIsEditing(true)}
              minWidth="80"
            >
              수정
            </Buttons.Outlined>
          </>
        ) : (
          <>
            <Buttons.Outlined
              type={"grey"}
              onClick={() => {
                setIsEditing(false);
                setDraft(rootKey);
              }}
              minWidth="80"
              disabled={updating}
            >
              취소
            </Buttons.Outlined>
            <Buttons.Outlined
              type={"grey"}
              onClick={onSave}
              minWidth="80"
              disabled={!canSave || updating}
            >
              저장
            </Buttons.Outlined>
          </>
        )}
      </Division>

      <Divide $border={false} top={10} bottom={0} />
    </div>
  );
};

export default DrmRootKeySection;