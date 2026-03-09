import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Spin } from 'signlw';
import Buttons from '@/components/Atoms/Buttons';
import Division from '@/components/Atoms/Division';
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

  const isVisible = section?.visible || authCd === 'SYS';
  const isEditable = !!section?.editable;
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
    if (section?.value) {
      setInputEmpNo(section.value);
    } else {
      setInputEmpNo('');
    }
  }, [section?.value]);

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

  const resetVerifyState = useCallback(() => {
    dispatch(resetDrmEmpNoResult());
  }, [dispatch]);

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
    // 기본 상태: 공통 하단 구독신청 버튼 비활성
    if (!selectedKey || !keyId) {
      notifyParentState({
        enabled: false,
        verifiedEmpNo: null,
      });
      return;
    }

    // SYS 키가 아니면 비활성
    if (authCd !== 'SYS') {
      notifyParentState({
        enabled: false,
        verifiedEmpNo: null,
      });
      return;
    }

    // APR / NOR 상태면 비활성
    if (isReadonlyStatus || !isEditable) {
      notifyParentState({
        enabled: false,
        verifiedEmpNo: null,
      });
      return;
    }

    // VALID일 때만 활성
    if (result?.status === VERIFY_STATUS.VALID) {
      notifyParentState({
        enabled: true,
        verifiedEmpNo: inputEmpNo,
      });
      return;
    }

    notifyParentState({
      enabled: false,
      verifiedEmpNo: null,
    });
  }, [
    selectedKey,
    keyId,
    authCd,
    isReadonlyStatus,
    isEditable,
    result?.status,
    inputEmpNo,
    notifyParentState,
  ]);

  const handleChangeEmpNo = (e) => {
    setInputEmpNo(e?.target?.value || '');
    resetVerifyState();

    notifyParentState({
      enabled: false,
      verifiedEmpNo: null,
    });
  };

  const validateBeforeVerify = useCallback(() => {
    if (!selectedKey || !keyId) {
      addToast('시스템 키를 선택해주세요.', 'warning');
      return false;
    }

    if (authCd !== 'SYS') {
      addToast('시스템 키를 선택해주세요.', 'warning');
      return false;
    }

    if (isReadonlyStatus || !isEditable) {
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
    authCd,
    isReadonlyStatus,
    isEditable,
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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="drm-empno-section">
      <div className="title">시스템 사번</div>

      <Spin spinning={infoLoading}>
        {!isEditable ? (
          <>
            <div className="readonly-box">
              {section?.value || '-'}
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
                placeholder="시스템 사번 입력"
                maxLength={30}
                style={{ width: 280 }}
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