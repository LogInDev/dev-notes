import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from 'signlw';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import ContentHeader from "@/components/Organisms/ContentHeader";
import Division from "@/components/Atoms/Division";
import Buttons from "@/components/Atoms/Buttons";
import Input from "@/components/Atoms/Input";
import { useToast } from "@/utils/ToastProvider";
import {
  fetchDrmEmpNoInfo,
  verifyDrmEmpNo,
  resetDrmEmpNoResult,
} from "@/store/reduxStore/detail/reducer";

const VERIFY_STATUS = {
  VALID: 'VALID',
  DUPLICATED_SYS_EMP_NO: 'DUPLICATED_SYS_EMP_NO',
  DUPLICATED_KEY: 'DUPLICATED_KEY',
  INVALID: 'INVALID',
  INVALID_KEY_TYPE: 'INVALID_KEY_TYPE',
};

const SysEmpNo = ({ svcId, keyId, selectedKey, onValidationChange }) => {
   const dispatch = useDispatch();
  const { addToast } = useToast();

  const detailState = useSelector((state) => state.get('detail')) || {};
  const drmEmpNoState = detailState?.drmEmpNo || {};
  const subscriptionStatus =
    detailState?.permission?.subscriptionPermission || 'NON';

  const {
    infoLoading = false,
    info = null,
    verifyLoading = false,
    result = null,
    error = null,
  } = drmEmpNoState;

  const [inputSysEmpNo, setInputSysEmpNo] = useState('');

  const authCd = selectedKey?.authCd || null;
  const isPsnKey = authCd === 'PSN';
  const hasMappedEmpNo = !!info?.sysEmpNo;
  const isReadonlyStatus =
    subscriptionStatus === 'APR' || subscriptionStatus === 'NOR';

  useEffect(() => {
    dispatch(resetDrmEmpNoResult());

    if (svcId && keyId && isPsnKey) {
      dispatch(fetchDrmEmpNoInfo({ svcId, keyId }));
    } else {
      setInputSysEmpNo('');
    }
  }, [dispatch, svcId, keyId]);

  useEffect(() => {
    if (hasMappedEmpNo) {
      setInputSysEmpNo(info?.sysEmpNo);
    } else {
      setInputSysEmpNo('');
    }
  }, [hasMappedEmpNo, info?.sysEmpNo]);

  const verifyMessage = useMemo(() => {
    console.log('verifyMessage===========11========', result)

    const status = result;

    if (status === VERIFY_STATUS.VALID) {
      return intlObj.get(message['store.validation.validSysEmpNo']);
    }

    if (status === VERIFY_STATUS.DUPLICATED_SYS_EMP_NO) {
      return intlObj.get(message['store.validation.duplicatedSysEmpNo']);
    }

    if (status === VERIFY_STATUS.DUPLICATED_KEY) {
      return intlObj.get(message['store.validation.duplicatedKey']);
    }

    if (status === VERIFY_STATUS.INVALID) {
      return intlObj.get(message['store.validation.invalidSysEmpNo']);
    }

    if (status === VERIFY_STATUS.INVALID_KEY_TYPE) {
      return intlObj.get(message['store.validation.invalidKeyType']);
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
    // if (!selectedKey || !keyId) {
    //   notifyParentState({ enabled: false, verifiedEmpNo: null });
    //   return;
    // }

    // if (!isPsnKey) {
    //   notifyParentState({ enabled: false, verifiedEmpNo: null });
    //   return;
    // }

    // if(hasMappedEmpNo) {
    //   notifyParentState({
    //     enabled: true,
    //     verifiedEmpNo: hasMappedEmpNo,
    //   });
    //   return;
    // }

    // if (isReadonlyStatus) {
    //   notifyParentState({ enabled: false, verifiedEmpNo: null });
    //   return;
    // }

    // if (result === VERIFY_STATUS.VALID) {
    //   notifyParentState({
    //     enabled: true,
    //     verifiedEmpNo: inputSysEmpNo,
    //   });
    //   return;
    // }



    notifyParentState({ enabled: false, verifiedEmpNo: null });
  }, [
    selectedKey,
    keyId,
    isPsnKey,
    hasMappedEmpNo,
    isReadonlyStatus,
    result,
    inputSysEmpNo,
    notifyParentState,
  ]);

  // const handleChangeEmpNo = (e) => {
  //   if (!isPsnKey) {
  //     addToast(intlObj.get(message['store.validation.selectKeyType']), 'warning');
  //     return;
  //   }

  //   if (isReadonlyStatus) {
  //     return;
  //   }

  //   setInputSysEmpNo(e?.target?.value.toUpperCase() || '');
  //   dispatch(resetDrmEmpNoResult());
  //   notifyParentState({
  //     enabled: false,
  //     verifiedEmpNo: null,
  //   });
  // };

  // const handleClickInput = () => {
  //   if (!isPsnKey) {
  //     addToast(intlObj.get(message['store.validation.selectKeyType']), 'warning');
  //   }
  // };

  // const validateBeforeVerify = useCallback(() => {
  //   if (!selectedKey || !keyId) {
  //     addToast(intlObj.get(message['store.validation.selectKeyType']), 'warning');
  //     return false;
  //   }

  //   if (!isPsnKey) {
  //     addToast(intlObj.get(message['store.validation.selectKeyType']), 'warning');
  //     return false;
  //   }

  //   if (isReadonlyStatus) {
  //     return false;
  //   }

  //   if (!inputSysEmpNo) {
  //     addToast(intlObj.get(message['store.validation.sysEmpNo']), 'warning');
  //     return false;
  //   }

  //   if (!inputSysEmpNo.startsWith('X99')) {
  //     addToast(intlObj.get(message['store.validation.sysEmpNoPrefixRule']), 'warning');
  //     return false;
  //   }

  //   return true;
  // }, [
  //   selectedKey,
  //   keyId,
  //   isPsnKey,
  //   isReadonlyStatus,
  //   inputSysEmpNo,
  //   addToast,
  // ]);

  const handleVerify = () => {
    if (verifyLoading) {
      return;
    }

  //   const isValid = validateBeforeVerify();
  //   if (!isValid) {
  //     return;
  //   }

    dispatch(
      verifyDrmEmpNo({
        keyId,
        sysEmpNo: inputSysEmpNo,
      }),
    );
  };

  return (
    <div className="drm-empno-section">
      <ContentHeader title={intlObj.get(message['store.sysEmpNo'])} $border={true} spacing={20} />

      <Spin spinning={infoLoading}>
        {hasMappedEmpNo ? (
            <div className="readonly-box">
              {info?.sysEmpNo}
            </div>
        ) : (
          <>
            <Division flex gap={8} alignItems="center">
              <Input
                value={inputSysEmpNo}
                // onChange={handleChangeEmpNo}
                // onClick={handleClickInput}
                placeholder={intlObj.get(message['store.placeholder.sysEmpNo'])}
                maxLength={100}
                maxWidth={350}
                readOnly={!isPsnKey}
              />

              <Buttons.Outlined
                type={"grey"}
                onClick={handleVerify}
                minWidth="80"
                disabled={verifyLoading}
              >
                {intlObj.get(message['store.validationCheck'])}
              </Buttons.Outlined>
            </Division>

            {verifyMessage && (
              <div
                className={
                  result === VERIFY_STATUS.VALID
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

export default SysEmpNo;
