import { useMemo, useState, useEffect } from "react";
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

  const serviceDetail =
    useSelector((state) => state.get("detail"))?.detail?.serviceDetail || {};
  const rootKey = serviceDetail?.rootKey;

  const drmRootKeyState =
    useSelector((state) => state.get("detail"))?.drmRootKey || {};
  const updateLoading = drmRootKeyState?.updateLoading || false;
  const success = drmRootKeyState?.success || false;
  const error = drmRootKeyState?.error;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (success) {
      addToast("Root Key가 수정되었습니다.", "success");
      dispatch(resetDrmRootKeyResult());
      setIsEditing(false);
    }
    if (error) {
      addToast("Root Key 수정 중 오류가 발생했습니다.", "error");
      dispatch(resetDrmRootKeyResult());
    }
  }, [success, error]);

  const onCopy = async () => {
    try {
      if (!rootKey) return addToast("Root Key 정보가 없습니다.", "warning");
      await navigator.clipboard.writeText(rootKey);
      addToast("Root Key가 복사되었습니다.", "success");
    } catch {
      addToast("복사에 실패했습니다.", "error");
    }
  };

  const onStartEdit = () => {
    setValue(rootKey || "");
    setIsEditing(true);
  };

  const onCancel = () => {
    setIsEditing(false);
    setValue("");
  };

  const onSave = () => {
    const v = (value || "").trim();
    if (!v) return addToast("Root Key를 입력해 주세요.", "warning");
    dispatch(updateDrmRootKey({ svcId, rootKey: v }));
  };

  return (
    <div>
      <ContentHeader $border={true} title="Root Key" spacing={20} />

      <Division flex={true} gap={10} alignItems={"center"}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={200}
            />
          ) : (
            <div style={{ wordBreak: "break-all", opacity: 0.9 }}>
              {rootKey || "-"}
            </div>
          )}
        </div>

        {!isEditing ? (
          <Division flex={true} gap={6} alignItems={"center"}>
            <Buttons.Outlined type={"grey"} onClick={onCopy} minWidth="80">
              복사
            </Buttons.Outlined>
            <Buttons.Outlined type={"grey"} onClick={onStartEdit} minWidth="80">
              수정
            </Buttons.Outlined>
          </Division>
        ) : (
          <Division flex={true} gap={6} alignItems={"center"}>
            <Buttons.Outlined type={"grey"} onClick={onSave} minWidth="80" disabled={updateLoading}>
              저장
            </Buttons.Outlined>
            <Buttons.Outlined type={"grey"} onClick={onCancel} minWidth="80" disabled={updateLoading}>
              취소
            </Buttons.Outlined>
          </Division>
        )}
      </Division>

      <Divide $border={false} top={10} bottom={0} />
    </div>
  );
};

export default DrmRootKeySection;