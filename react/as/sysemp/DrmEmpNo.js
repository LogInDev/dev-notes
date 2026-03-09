import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Spin } from 'signlw';
import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';
import { useToast } from '@/utils/ToastProvider';
import {
  fetchDrmEmpNoInfo,
  verifyDrmEmpNo,
  resetDrmEmpNoResult,
} from '@/store/reduxStore/detail/reducer';

const VERIFY_STATUS = {
  VALID: 'VALID',
  DUPLICATED: 'DUPLICATED',
  INVALID: 'INVALID',
};

const DrmEmpNoSection = ({
  svcId,
  keyId,
  selectedKey,
  onValidationChange,
}) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const detailState = useSelector((state) => state.get('detail')) || {};
  const drmEmpNoState = detailState?.drmEmpNo || {};

  const {
    infoLoading = false,
    info = null,
    verifyLoading = false,
    result = null,
    error = null,
  } = drmEmpNoState;

  const [inputEmpNo, setInputEmpNo] = useState('');

  const section = info?.systemEmpNoSection || {};
  const authCd = info?.authCd || selectedKey?.authCd || null;
  const subscriptionStatus = info?.subscriptionStatus || null;

  // ✅ DRM이면 항상 섹션은 보인다고 가정
  const hasMappedEmpNo = !!section?.value;
  const isSysKey = authCd === 'SYS';
  const isReadonlyStatus =
    subscriptionStatus === 'APR' || subscriptionStatus === 'NOR';

  useEffect(() => {
    dispatch(resetDrmEmpNoResult());

    if (svcId && keyId) {
      dispatch(fetchDrmEmpNoInfo({ svcId, keyId }));
    } else {
      setInputEmpNo('');
    }
  }, [dispatch, svcId, keyId]);

  useEffect(() => {
    if (hasMappedEmpNo) {
      setInputEmpNo(section.value);
    } else {
      setInputEmpNo('');
    }
  }, [hasMappedEmpNo, section?.value]);

  const verifyMessage = useMemo(() => {
    const status = result?.status;

    if (status === VERIFY_STATUS.VALID) {
      return '유효한 시스템 사번입니다.';
    }

    if (status === VERIFY_STATUS.DUPLICATED) {
      return '이미 사용 중인 시스템 사번입니다.';
    }

    if (status === VERIFY_STATUS.INVALID) {
      return '유효하지 않은 시스템 사번입니다.';
    }

    if (error?.message) {
      return error.message;
    }

    return '';
  }, [result, error]);

  const notifyParentState = useCallback(
    ({ enabled = false, verifiedEmpNo = null }) => {
      if (typeof onValidationChange === 'function') {
        onValidationChange({
          enabled,
          verifiedEmpNo,
        });
      }
    },
    [onValidationChange],
  );

  useEffect(() => {
    // 기본값: 비활성
    if (!selectedKey || !keyId) {
      notifyParentState({ enabled: false, verifiedEmpNo: null });
      return;
    }

    // SYS 키 아니면 공통 구독신청 버튼 비활성
    if (!isSysKey) {
      notifyParentState({ enabled: false, verifiedEmpNo: null });
      return;
    }

    // APR/NOR이면 비활성
    if (isReadonlyStatus) {
      notifyParentState({ enabled: false, verifiedEmpNo: null });
      return;
    }

    // VALID인 경우만 활성
    if (result?.status === VERIFY_STATUS.VALID) {
      notifyParentState({
        enabled: true,
        verifiedEmpNo: inputEmpNo,
      });
      return;
    }

    notifyParentState({ enabled: false, verifiedEmpNo: null });
  }, [
    selectedKey,
    keyId,
    isSysKey,
    isReadonlyStatus,
    result?.status,
    inputEmpNo,
    notifyParentState,
  ]);

  const handleChangeEmpNo = (e) => {
    if (!isSysKey) {
      addToast('시스템 타입 키로 변경해주세요.', 'warning');
      return;
    }

    if (isReadonlyStatus) {
      return;
    }

    setInputEmpNo(e?.target?.value || '');
    dispatch(resetDrmEmpNoResult());
    notifyParentState({ enabled: false, verifiedEmpNo: null });
  };

  const handleClickInput = () => {
    if (!isSysKey) {
      addToast('시스템 타입 키로 변경해주세요.', 'warning');
    }
  };

  const validateBeforeVerify = useCallback(() => {
    if (!selectedKey || !keyId) {
      addToast('시스템 타입 키로 변경해주세요.', 'warning');
      return false;
    }

    if (!isSysKey) {
      addToast('시스템 타입 키로 변경해주세요.', 'warning');
      return false;
    }

    if (isReadonlyStatus) {
      return false;
    }

    if (!inputEmpNo) {
      addToast('시스템 사번을 입력해주세요.', 'warning');
      return false;
    }

    if (!inputEmpNo.startsWith('X99')) {
      addToast('시스템 사번은 X99로 시작해야 합니다.', 'warning');
      return false;
    }

    return true;
  }, [
    selectedKey,
    keyId,
    isSysKey,
    isReadonlyStatus,
    inputEmpNo,
    addToast,
  ]);

  const handleVerify = () => {
    if (verifyLoading) {
      return;
    }

    const isValid = validateBeforeVerify();
    if (!isValid) {
      return;
    }

    dispatch(
      verifyDrmEmpNo({
        svcId,
        keyId,
        empNo: inputEmpNo,
      }),
    );
  };

  return (
    <div className="drm-empno-section">
      <div className="title">시스템 사번</div>

      <Spin spinning={infoLoading}>
        {/* ✅ 매핑된 시스템 사번이 있을 때만 read-only 표시 */}
        {hasMappedEmpNo ? (
          <>
            <div className="readonly-box">
              {section?.value}
            </div>

            {section?.message && (
              <div className="desc-text">{section.message}</div>
            )}
          </>
        ) : (
          <>
            <Division flex gap={8} alignItems="center">
              <Input
                value={inputEmpNo}
                onChange={handleChangeEmpNo}
                onClick={handleClickInput}
                onFocus={handleClickInput}
                placeholder="시스템 사번 입력"
                maxLength={30}
                style={{ width: 280 }}
                readOnly={!isSysKey}
              />

              <Buttons.Basic
                type="line"
                onClick={handleVerify}
                disabled={verifyLoading}
              >
                유효성 검사
              </Buttons.Basic>
            </Division>

            {section?.message && (
              <div className="desc-text" style={{ marginTop: 8 }}>
                {section.message}
              </div>
            )}

            {verifyMessage && (
              <div
                className={
                  result?.status === VERIFY_STATUS.VALID
                    ? 'desc-text success'
                    : 'desc-text error'
                }
                style={{ marginTop: 8 }}
              >
                {verifyMessage}
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default DrmEmpNoSection;