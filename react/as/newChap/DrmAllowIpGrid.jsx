// src/components/Organisms/DrmAllowIpGrid.jsx
import { useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { useToast } from '@/utils/ToastProvider';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';

import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';
import ContentHeader from '@/components/Organisms/ContentHeader';

import {
  upsertDrmAllowIp,
  deleteDrmAllowIp,
  updateField,
} from '@/store/reduxStore/detail/reducer';

import { isValidIpOrCidr, normalizeIpOrCidr } from '@/utils/ipCidrUtils';

const COLS = 4;

const splitToColumns = (list) => {
  const cols = Array.from({ length: COLS }, () => []);
  for (let i = 0; i < list.length; i += 1) {
    cols[i % COLS].push(list[i]); // ✅ 가로 순서대로 분배
  }
  return cols;
};

const DrmAllowIpGrid = ({ svcId, disabled }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const drmState = useSelector((state) => state.get('detail'))?.drm || {};
  const allowIpList = drmState?.allowIpList || [];
  const upsertLoading = drmState?.upsertAllowIpLoading || false;
  const deleteLoading = drmState?.deleteAllowIpLoading || false;

  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const columns = useMemo(() => splitToColumns(allowIpList), [allowIpList]);

  const isBusy = upsertLoading || deleteLoading;

  const resetEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleAdd = useCallback(() => {
    const v = normalizeIpOrCidr(inputValue);
    if (!v) return;

    if (!isValidIpOrCidr(v)) {
      addToast('IP 형식이 올바르지 않습니다. (예: 10.0.0.1 또는 10.0.0.1/25)', 'error');
      return;
    }

    // ✅ 중복 체크(프론트 선제 차단 + 서버에서도 다시 검증 권장)
    const duplicated = allowIpList.some((x) => (x?.ipCidr || '').trim() === v);
    if (duplicated) {
      addToast('이미 등록된 허용 IP 입니다.', 'warning');
      return;
    }

    dispatch(
      upsertDrmAllowIp({
        svcId,
        allowIpId: null, // ✅ add
        ipCidr: v,
      }),
    );

    setInputValue('');
  }, [inputValue, allowIpList, svcId, dispatch, addToast]);

  const handleStartEdit = useCallback((row) => {
    setEditingId(row.id);
    setEditingValue(row.ipCidr);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const v = normalizeIpOrCidr(editingValue);
    if (!v || !editingId) return;

    if (!isValidIpOrCidr(v)) {
      addToast('IP 형식이 올바르지 않습니다. (예: 10.0.0.1 또는 10.0.0.1/25)', 'error');
      return;
    }

    // ✅ 수정 시 중복 체크 (본인 제외)
    const duplicated = allowIpList.some((x) => x.id !== editingId && (x?.ipCidr || '').trim() === v);
    if (duplicated) {
      addToast('이미 등록된 허용 IP 입니다.', 'warning');
      return;
    }

    dispatch(
      upsertDrmAllowIp({
        svcId,
        allowIpId: editingId, // ✅ update
        ipCidr: v,
      }),
    );

    resetEdit();
  }, [editingId, editingValue, allowIpList, svcId, dispatch, addToast]);

  const handleDelete = useCallback(
    (row) => {
      dispatch(
        deleteDrmAllowIp({
          svcId,
          allowIpId: row.id,
        }),
      );
      if (editingId === row.id) resetEdit();
    },
    [svcId, dispatch, editingId],
  );

  return (
    <Wrapper>
      {/* ✅ Root Key / 시스템 환경 설정 모양 유지: ContentHeader + Division 톤 그대로 */}
      <ContentHeader $border={true} title="허용 IP" spacing={20} />

      {/* ✅ 4단 위에 Input + 추가 버튼 1개 */}
      <Division flex={true} gap={10} alignItems={'center'} mb={16}>
        <InputLike
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="예: 10.0.0.1 또는 10.0.0.1/25"
          disabled={disabled || isBusy}
        />
        <Buttons.Basic
          type={'primary'}
          onClick={handleAdd}
          disabled={disabled || isBusy || !inputValue.trim()}
        >
          추가
        </Buttons.Basic>
      </Division>

      <Grid>
        {columns.map((col, colIndex) => (
          <Column key={`col-${colIndex}`}>
            {col.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <Row key={row.id}>
                  <IpCell>
                    {isEditing ? (
                      <EditInput
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        disabled={disabled || isBusy}
                      />
                    ) : (
                      <IpText title={row.ipCidr}>{row.ipCidr}</IpText>
                    )}
                  </IpCell>

                  <BtnCell>
                    {isEditing ? (
                      <BtnGroup>
                        <Buttons.IconSave
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          disabled={disabled || isBusy}
                        />
                        <Buttons.IconCancel
                          onClick={(e) => {
                            e.stopPropagation();
                            resetEdit();
                          }}
                          disabled={disabled || isBusy}
                        />
                      </BtnGroup>
                    ) : (
                      <BtnGroup>
                        <Buttons.IconEdit
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(row);
                          }}
                          disabled={disabled || isBusy}
                        />
                        <Buttons.IconDeleteRed
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                          }}
                          disabled={disabled || isBusy}
                        />
                      </BtnGroup>
                    )}
                  </BtnCell>
                </Row>
              );
            })}
          </Column>
        ))}
      </Grid>

      <Hint>
        단일 IP 또는 CIDR만 허용됩니다. (예: <b>10.0.0.1</b>, <b>10.0.0.1/25</b>)
      </Hint>
    </Wrapper>
  );
};

export default DrmAllowIpGrid;

/* ================= styles ================= */

const Wrapper = styled.div`
  .${({ theme }) => theme.namespace} & {
    width: 100%;
  }
`;

const Grid = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
`;

const Column = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;

const Row = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #e6e6e6;
    border-radius: 10px;
    background: #ffffff;
  }
`;

const IpCell = styled.div`
  .${({ theme }) => theme.namespace} & {
    flex: 1;
    min-width: 0;
  }
`;

const BtnCell = styled.div`
  .${({ theme }) => theme.namespace} & {
    width: 60px;
    display: flex;
    justify-content: flex-end;
  }
`;

const BtnGroup = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    align-items: center;
  }
`;

const IpText = styled.div`
  .${({ theme }) => theme.namespace} & {
    font-size: 13px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

// 프로젝트에 Input 컴포넌트가 있긴 하지만(Atoms/Input),
// DRM UI는 ApiDetail쪽에서 이미 input 인라인 스타일 쓰는 흐름이 있어서,
// 여기서는 성능/의존성 줄이려고 "가벼운 input"으로 통일 (원하면 Input으로 바꿔도 됨)
const InputLike = styled.input`
  .${({ theme }) => theme.namespace} & {
    flex: 1;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #ddd;
    padding: 0 12px;
    outline: none;
  }
`;

const EditInput = styled.input`
  .${({ theme }) => theme.namespace} & {
    width: 100%;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #ddd;
    padding: 0 10px;
    outline: none;
  }
`;

const Hint = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin-top: 12px;
    font-size: 12px;
    opacity: 0.85;
  }
`;
