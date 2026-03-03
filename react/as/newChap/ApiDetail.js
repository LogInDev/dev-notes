import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Spin } from 'signlw';

import ContentHeader from '@/components/Organisms/ContentHeader';
import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';

import DrmAllowIpGrid from '@/components/Organisms/DrmAllowIpGrid';

import {
  fetchDrmConfig,
  verifyDrmEmpNo,
  updateField,
} from '@/store/reduxStore/detail/reducer';

// ... (기존 ApiDetail 코드)

const ApiDetail = () => {
  const dispatch = useDispatch();
  const { addToast } = useToast(); // ApiDetail에서 이미 쓰는 경우만

  const detailState = useSelector((state) => state.get('detail'))?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const svcId = serviceDetail?.svcId; // 너 코드에선 params의 svcId를 쓰는 구조일 수도 있음(맞게 변경)
  const svcType = serviceDetail?.svcType;

  const drmState = useSelector((state) => state.get('detail'))?.drm || {};
  const rootKey = drmState?.rootKey;
  const empNoStatus = drmState?.empNoStatus || 'idle';
  const fetchDrmConfigLoading = drmState?.fetchDrmConfigLoading || false;
  const verifyLoading = drmState?.verifyEmpNoLoading || false;

  const [drmEmpNo, setDrmEmpNo] = useState('');

  const isDrm = svcType === 'DRM';

  // ✅ 권한 판단(프로젝트 실제 필드에 맞춰 수정 필요)
  // 예: serviceDetail.isManagerOrAdmin === true 같은 값이 있다고 가정
  const canSeeRootKey = Boolean(serviceDetail?.isManagerOrAdmin);

  useEffect(() => {
    if (isDrm && svcId) {
      dispatch(fetchDrmConfig({ svcId })); // ✅ RootKey/allowIpList 로드
    }
  }, [isDrm, svcId, dispatch]);

  const verifyDrmEmpNoClick = () => {
    if (!drmEmpNo.trim()) {
      addToast?.('사번을 입력해주세요.', 'warning');
      return;
    }
    dispatch(verifyDrmEmpNo({ svcId, empNo: drmEmpNo.trim() }));
  };

  return (
    <>
      {/* ... 기존 ApiDetail 상단 영역 그대로 ... */}

      <Spin spinning={fetchDrmConfigLoading}>
        {isDrm && (
          <>
            {/* ✅ Root Key 섹션(모양 유지) */}
            {canSeeRootKey && (
              <>
                <ContentHeader $border={true} title="Root Key" spacing={20} />
                <Division flex={true} gap={10} alignItems={'center'} mb={20}>
                  <Division.SubTitle style={{ minWidth: 70 }}>
                    Root Key
                  </Division.SubTitle>
                  <div style={{ fontSize: 13 }}>
                    {rootKey ? rootKey : '-'}
                  </div>
                </Division>
              </>
            )}

            {/* ✅ 시스템 계정 사번 확인(모양 유지) */}
            <ContentHeader $border={true} title="시스템 계정 사번" spacing={20} />

            <Division flex={true} gap={20} alignItems={'center'} mb={12}>
              <Division.SubTitle>
                DRM 서비스 구독 전, 시스템 계정 사번 확인이 필요합니다.
              </Division.SubTitle>
            </Division>

            <Division flex={true} gap={10} alignItems={'center'} mb={10}>
              <input
                value={drmEmpNo}
                onChange={(e) => setDrmEmpNo(e.target.value)}
                placeholder="예: X990001"
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid #ddd',
                  padding: '0 12px',
                }}
              />
              <Buttons.Basic
                type={'primary'}
                onClick={verifyDrmEmpNoClick}
                disabled={verifyLoading}
              >
                {verifyLoading ? '확인 중...' : '유효성 확인'}
              </Buttons.Basic>
            </Division>

            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>
              {empNoStatus === 'valid' && '유효한 시스템 계정입니다.'}
              {empNoStatus === 'duplicated' && '이미 등록된 시스템 계정입니다.'}
              {empNoStatus === 'invalid' && '유효하지 않은 시스템 계정입니다.'}
              {empNoStatus === 'idle' && "사번 입력 후 '유효성 확인'을 눌러주세요"}
              {empNoStatus === 'checking' && '확인 중...'}
            </div>

            {/* ✅ 허용 IP 4단 Grid */}
            <DrmAllowIpGrid
              svcId={svcId}
              // 실무 기준: 사번 검증이 valid일 때만 활성화하고 싶으면 아래처럼
              disabled={empNoStatus !== 'valid'}
            />
          </>
        )}
      </Spin>

      {/* ... 기존 ApiDetail 하단(구독 버튼/탭 등) ... */}
    </>
  );
};

export default ApiDetail;
