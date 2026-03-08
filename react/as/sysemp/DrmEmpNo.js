import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Spin } from 'signlw';
import Buttons from '@/components/Atoms/Buttons';
import Division from '@/components/Atoms/Division';
import { useToast } from '@/utils/ToastProvider';
import {
  fetchDrmEmpNoInfo,
  verifyDrmEmpNo,
  requestDrmSubscribe,
  resetDrmEmpNoResult,
} from '@/store/reduxStore/detail/reducer';

const VERIFY_STATUS = {
  VALID: 'VALID',
  DUPLICATED: 'DUPLICATED',
  INVALID: 'INVALID',
};

const DrmEmpNoSection = ({ svcId, keyId, selectedKey }) => {
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
    subscribeLoading = false,
  } = drmEmpNoState;

  const [inputEmpNo, setInputEmpNo] = useState('');

  const section = info?.systemEmpNoSection || {};
  const authCd = info?.authCd || selectedKey?.authCd;
  const subscriptionStatus = info?.subscriptionStatus || null;

  const isVisible = section?.visible || authCd === 'SYS';
  const isEditable = !!section?.editable;

  useEffect(() => {
    dispatch(resetDrmEmpNoResult());

    if (keyId && svcId) {
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

  const canVerify = useMemo(() => {
    return !!svcId && !!keyId && !!inputEmpNo;
  }, [svcId, keyId, inputEmpNo]);

  const canRequestSubscribe = useMemo(() => {
    return (
      !!svcId &&
      !!keyId &&
      isEditable &&
      result?.status === VERIFY_STATUS.VALID
    );
  }, [svcId, keyId, isEditable, result?.status]);

  const handleChangeEmpNo = (e) => {
    setInputEmpNo(e?.target?.value || '');
    dispatch(resetDrmEmpNoResult());
  };

  const handleVerify = () => {
    // 1. 키 선택 안 된 경우
    if (!selectedKey || !keyId) {
      addToast('시스템 키를 선택해주세요.', 'warning');
      return;
    }

    // 2. SYS 키가 아닌 경우
    if (selectedKey?.authCd !== 'SYS' && authCd !== 'SYS') {
      addToast('시스템 키를 선택해주세요.', 'warning');
      return;
    }

    // 3. 입력값 없는 경우
    if (!inputEmpNo) {
      addToast('시스템 사번을 입력해주세요.', 'warning');
      return;
    }

    // 4. X99 prefix 체크
    if (!inputEmpNo.startsWith('X99')) {
      addToast('시스템 사번은 X99로 시작해야 합니다.', 'warning');
      return;
    }

    // 5. readonly 상태에서는 검증 불가
    if (!isEditable) {
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

  const handleRequestSubscribe = () => {
    if (!selectedKey || !keyId) {
      addToast('시스템 키를 선택해주세요.', 'warning');
      return;
    }

    if (selectedKey?.authCd !== 'SYS' && authCd !== 'SYS') {
      addToast('시스템 키를 선택해주세요.', 'warning');
      return;
    }

    if (!inputEmpNo) {
      addToast('시스템 사번을 입력해주세요.', 'warning');
      return;
    }

    if (!inputEmpNo.startsWith('X99')) {
      addToast('시스템 사번은 X99로 시작해야 합니다.', 'warning');
      return;
    }

    if (!canRequestSubscribe) {
      addToast('시스템 사번 유효성 검사를 먼저 완료해주세요.', 'warning');
      return;
    }

    dispatch(
      requestDrmSubscribe({
        svcId,
        keyId,
        empNo: inputEmpNo,
      }),
    );
  };

  if (!isVisible) return null;

  return (
    <div className="drm-empno-section">
      <div className="title">시스템 사번</div>

      <Spin spinning={infoLoading || subscribeLoading}>
        {!isEditable ? (
          <>
            <div className="readonly-box">
              {section?.value || '-'}
            </div>

            {section?.message && (
              <div className="desc-text">{section.message}</div>
            )}

            {(subscriptionStatus === 'APR' || subscriptionStatus === 'NOR') && (
              <Division top={10}>
                <Buttons.Basic type="grey" disabled>
                  구독 신청
                </Buttons.Basic>
              </Division>
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
                disabled={!canVerify || verifyLoading}
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

            <Division top={10}>
              <Buttons.Basic
                type={canRequestSubscribe ? 'primary' : 'grey'}
                onClick={handleRequestSubscribe}
                disabled={!isEditable || subscribeLoading}
              >
                구독 신청
              </Buttons.Basic>
            </Division>
          </>
        )}
      </Spin>
    </div>
  );
};

export default DrmEmpNoSection;
