import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ContentHeader from "@/components/Organisms/ContentHeader";
import Division from "@/components/Atoms/Division";
import Buttons from "@/components/Atoms/Buttons";
import Input from "@/components/Atoms/Input";
import Divide from "@/components/Atoms/Divide";
import { useToast } from "@/utils/ToastProvider";
import {
  verifyDrmEmpNo,
  resetDrmEmpNoResult,
} from "@/store/reduxStore/detail/reducer";

const DRM_STATUS = {
  idle: "idle",
  checking: "checking",
  valid: "valid",
  duplicated: "duplicated",
  invalid: "invalid",
};

const isValidDrmEmpNoFormat = (value) => /^X99\d+$/i.test((value || "").trim());

const DrmEmpNoSection = ({ svcId, onVerified }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [empNo, setEmpNo] = useState("");
  const [status, setStatus] = useState(DRM_STATUS.idle);

  // ✅ 캐시는 ref(Map)로 관리
  const cacheRef = useRef(new Map()); // empNo -> status(valid/duplicated/invalid)
  const verifiedRef = useRef(null); // verified empNo

  const drmEmpNoState =
    useSelector((state) => state.get("detail"))?.drmEmpNo || {};
  const verifyLoading = drmEmpNoState?.verifyLoading || false;
  const success = drmEmpNoState?.success || false;
  const error = drmEmpNoState?.error;
  const result = drmEmpNoState?.result; // {empNo,status}

  useEffect(() => {
    if (success && result) {
      const emp = (result.empNo || empNo || "").trim().toUpperCase();
      const raw = result.status; // VALID/DUPLICATED/INVALID
      const normalized =
        raw === "VALID" ? DRM_STATUS.valid
        : raw === "DUPLICATED" ? DRM_STATUS.duplicated
        : DRM_STATUS.invalid;

      cacheRef.current.set(emp, normalized);
      setStatus(normalized);

      if (normalized === DRM_STATUS.valid) {
        verifiedRef.current = emp;
        onVerified?.(emp); // 필요시 외부로 전달
        addToast("유효한 시스템 계정입니다.", "success");
      } else if (normalized === DRM_STATUS.duplicated) {
        verifiedRef.current = null;
        addToast("이미 등록된 시스템 계정입니다.", "warning");
      } else {
        verifiedRef.current = null;
        addToast("유효하지 않은 시스템 계정입니다.", "error");
      }

      dispatch(resetDrmEmpNoResult());
    }

    if (error) {
      setStatus(DRM_STATUS.idle);
      verifiedRef.current = null;
      addToast("사번 유효성 확인 중 오류가 발생했습니다.", "error");
      dispatch(resetDrmEmpNoResult());
    }
  }, [success, error, result]);

  const verify = useCallback(() => {
    const raw = (empNo || "").trim();
    const v = raw.toUpperCase();

    if (!raw) {
      addToast("시스템 계정 사번을 입력해 주세요. (예: X99...)", "warning");
      return;
    }

    if (!isValidDrmEmpNoFormat(v)) {
      setStatus(DRM_STATUS.invalid);
      verifiedRef.current = null;
      addToast("사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.", "error");
      return;
    }

    const cached = cacheRef.current.get(v);
    if (cached) {
      setStatus(cached);
      verifiedRef.current = cached === DRM_STATUS.valid ? v : null;
      if (cached === DRM_STATUS.valid) addToast("유효한 시스템 계정입니다.", "success");
      if (cached === DRM_STATUS.duplicated) addToast("이미 등록된 시스템 계정입니다.", "warning");
      if (cached === DRM_STATUS.invalid) addToast("유효하지 않은 시스템 계정입니다.", "error");
      return;
    }

    setStatus(DRM_STATUS.checking);
    dispatch(verifyDrmEmpNo({ svcId, empNo: v }));
  }, [empNo, svcId]);

  const helperText = useMemo(() => {
    if (status === DRM_STATUS.checking) return "확인 중...";
    if (status === DRM_STATUS.valid) return "유효한 시스템 계정입니다.";
    if (status === DRM_STATUS.duplicated) return "이미 등록된 시스템 계정입니다.";
    if (status === DRM_STATUS.invalid) return "유효하지 않은 시스템 계정입니다.";
    return "사번 입력 후 '유효성 확인'을 눌러주세요";
  }, [status]);

  return (
    <div>
      <ContentHeader $border={true} title="시스템 계정 사번" spacing={20} />

      <Division flex={true} gap={20} alignItems={"center"} mb={20}>
        <Division.SubTitle>
          DRM 서비스 구독 전, X99로 시작하는 시스템 계정 사번 확인이 필요합니다.
        </Division.SubTitle>
      </Division>

      <Division flex={true} gap={10} alignItems={"center"}>
        <Input
          value={empNo}
          onChange={(e) => {
            setEmpNo(e.target.value);
            setStatus(DRM_STATUS.idle);
            verifiedRef.current = null;
          }}
          placeholder="예: X990001"
          maxLength={100}
          maxWidth={350}
        />
        <Buttons.Outlined
          type={"grey"}
          onClick={verify}
          minWidth="80"
          disabled={verifyLoading || status === DRM_STATUS.checking}
        >
          {status === DRM_STATUS.checking ? "확인 중..." : "유효성 확인"}
        </Buttons.Outlined>
      </Division>

      <Divide $border={false} top={10} bottom={0} />

      <div style={{ fontSize: 13, opacity: 0.85 }}>{helperText}</div>
      <Divide $border={false} top={10} bottom={0} />
    </div>
  );
};

export default DrmEmpNoSection;