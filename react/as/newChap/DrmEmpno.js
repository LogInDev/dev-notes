import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import ContentHeader from "@/components/Organisms/ContentHeader";
import Division from "@/components/Atoms/Division";
import Buttons from "@/components/Atoms/Buttons";
import Input from "@/components/Atoms/Input";
import Divide from "@/components/Atoms/Divide";
import { useToast } from "@/utils/ToastProvider";
import {
  verifyDrmEmpNo,
  resetDrmEmpNoStatus,
} from "@/store/reduxStore/detail/reducer";

const DRM_STATUS = {
  idle: "idle",
  checking: "checking",
  valid: "valid",
  duplicated: "duplicated",
  invalid: "invalid",
};

const isValidDrmEmpNoFormat = (value) => /^X99\d+$/i.test((value || "").trim());

const DrmEmpNoSection = ({ svcId }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [empNo, setEmpNo] = useState("");

  const drmEmpNoState = useSelector((state) => state.get("detail"))?.drmEmpNo || {};
  const status = drmEmpNoState?.status || DRM_STATUS.idle;
  const loading = drmEmpNoState?.loading || false;
  const verifiedEmpNo = drmEmpNoState?.verifiedEmpNo;
  const cache = drmEmpNoState?.cache || {};

  // ✅ 버튼 클릭 1회 + 캐시: 컴포넌트가 먼저 cache를 확인하고
  // 있으면 saga 호출 없이 상태만 반영할 수 있게 "localRef"로도 유지
  const localCacheRef = useRef(new Map());

  useEffect(() => {
    // redux cache -> local cache 동기화(성능/조회 빠름)
    Object.keys(cache).forEach((k) => localCacheRef.current.set(k, cache[k]));
  }, [cache]);

  const normalizedEmpNo = useMemo(() => (empNo || "").trim().toUpperCase(), [empNo]);

  const verify = useCallback(() => {
    const value = normalizedEmpNo;

    if (!value) {
      addToast("시스템 계정 사번을 입력해 주세요. (예: X99...)", "warning");
      return;
    }
    if (!isValidDrmEmpNoFormat(value)) {
      addToast("사번 형식이 올바르지 않습니다. X99로 시작하는 사번만 입력해 주세요.", "error");
      dispatch(resetDrmEmpNoStatus());
      return;
    }

    // ✅ 캐시 히트면 saga 호출 안 함(성능)
    const cached = localCacheRef.current.get(value);
    if (cached) {
      // redux state를 직접 바꾸는 액션을 추가해도 되지만,
      // 최소 수정으로는 "다시 verify dispatch"를 피하려면
      // 그냥 안내만 하고 사용가능여부는 아래 canRequestSubscribeForDrm으로 판단해도 됨.
      if (cached === DRM_STATUS.valid) addToast("유효한 시스템 계정입니다.", "success");
      if (cached === DRM_STATUS.duplicated) addToast("이미 등록된 시스템 계정입니다.", "warning");
      if (cached === DRM_STATUS.invalid) addToast("유효하지 않은 시스템 계정입니다.", "error");
      return;
    }

    dispatch(verifyDrmEmpNo({ svcId, empNo: value }));
  }, [normalizedEmpNo, dispatch, addToast, svcId]);

  // ✅ saga 결과에 대한 toast는 컴포넌트에서만
  useEffect(() => {
    if (status === DRM_STATUS.valid) addToast("유효한 시스템 계정입니다.", "success");
    if (status === DRM_STATUS.duplicated) addToast("이미 등록된 시스템 계정입니다.", "warning");
    if (status === DRM_STATUS.invalid) addToast("유효하지 않은 시스템 계정입니다.", "error");
  }, [status]);

  // ✅ 구독 가능 여부(기존 ApiDetail에서 쓰던 조건을 여기로 이동해도 됨)
  const canRequestSubscribeForDrm = useMemo(() => {
    return status === DRM_STATUS.valid && verifiedEmpNo === normalizedEmpNo;
  }, [status, verifiedEmpNo, normalizedEmpNo]);

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
            dispatch(resetDrmEmpNoStatus()); // 입력 바뀌면 검증 상태 리셋
          }}
          placeholder="예: X990001"
          maxLength={100}
          maxWidth={350}
        />
        <Buttons.Outlined type={"grey"} onClick={verify} minWidth="80" disabled={loading}>
          {loading ? "확인 중..." : "유효성 확인"}
        </Buttons.Outlined>
      </Division>

      <Divide $border={false} top={10} bottom={0} />
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {status === DRM_STATUS.valid && "유효한 시스템 계정입니다."}
        {status === DRM_STATUS.duplicated && "이미 등록된 시스템 계정입니다."}
        {status === DRM_STATUS.invalid && "유효하지 않은 시스템 계정입니다."}
        {status === DRM_STATUS.idle && "사번 입력 후 '유효성 확인'을 눌러주세요"}
      </div>

      {/* 필요하면 ApiDetail에서 이 값을 받아서 구독버튼 enabled/disabled에 반영 */}
      {/* <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        구독 가능: {canRequestSubscribeForDrm ? "YES" : "NO"}
      </div> */}

      <Divide $border={false} top={10} bottom={0} />
    </div>
  );
};

export default DrmEmpNoSection;