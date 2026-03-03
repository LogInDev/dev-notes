// src/components/Organisms/DrmAllowIpGrid.jsx
import { useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Input from '@/components/Atoms/Input';

import { useToast } from '@/utils/ToastProvider';
import { isValidIpOrCidr, normalizeIpOrCidr } from '@/utils/ipCidrUtils';

import {
  upsertDrmAllowIp,
  deleteDrmAllowIp,
} from '@/store/reduxStore/detail/reducer';

const COLS = 4;

// ✅ 가로 순서대로 4단 분배
const splitToColumns = (list) => {
  const cols = Array.from({ length: COLS }, () => []);
  for (let i = 0; i < list.length; i += 1) {
    cols[i % COLS].push(list[i]);
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

  const isBusy = upsertLoading || deleteLoading;

  const columns = useMemo(() => splitToColumns(allowIpList), [allowIpList]);

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

    const duplicated = allowIpList.some((x) => (x?.ipCidr || '').trim() === v);
    if (duplicated) {
      addToast('이미 등록된 허용 IP 입니다.', 'warning');
      return;
    }

    dispatch(upsertDrmAllowIp({ svcId, allowIpId: null, ipCidr: v }));
    setInputValue('');
  }, [inputValue, allowIpList, svcId, dispatch, addToast]);

  const handleStartEdit = (row) => {
    setEditingId(row.id);
    setEditingValue(row.ipCidr);
  };

  const handleSaveEdit = useCallback(() => {
    const v = normalizeIpOrCidr(editingValue);
    if (!v || !editingId) return;

    if (!isValidIpOrCidr(v)) {
      addToast('IP 형식이 올바르지 않습니다. (예: 10.0.0.1 또는 10.0.0.1/25)', 'error');
      return;
    }

    const duplicated = allowIpList.some(
      (x) => x.id !== editingId && (x?.ipCidr || '').trim() === v,
    );
    if (duplicated) {
      addToast('이미 등록된 허용 IP 입니다.', 'warning');
      return;
    }

    dispatch(upsertDrmAllowIp({ svcId, allowIpId: editingId, ipCidr: v }));
    resetEdit();
  }, [editingId, editingValue, allowIpList, svcId, dispatch, addToast]);

  const handleDelete = (row) => {
    dispatch(deleteDrmAllowIp({ svcId, allowIpId: row.id }));
    if (editingId === row.id) resetEdit();
  };

  return (
    <Wrapper>
      <ContentHeader title="허용 IP 관리" $border={true} spacing={20} />

      {/* ✅ 요구사항: 테이블 위에 Input + '추가' 버튼 1개 */}
      <Division flex={true} gap={10} alignItems={'center'}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="허용 IP를 입력하세요. (예: 10.0.0.0/25)"
          maxLength={100}
          maxWidth={350}
          disabled={disabled || isBusy}
        />
        <Buttons.Outlined
          type={'grey'}
          onClick={handleAdd}
          minWidth="80"
          disabled={disabled || isBusy || !inputValue.trim()}
        >
          추가
        </Buttons.Outlined>
      </Division>

      <Hint>
        단일 IP 또는 CIDR만 허용됩니다. (예: <b>10.0.0.1</b>, <b>10.0.0.0/25</b>)
      </Hint>

      {/* ✅ 요구사항: 4단 가로 배치, 헤더 없음, 바로 row만 */}
      <Grid>
        {columns.map((col, idx) => (
          <Column key={`col-${idx}`}>
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
    </Wrapper>
  );
};

export default DrmAllowIpGrid;

/* ================= styles ================= */

const Wrapper = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin-top: 10px;
  }
`;

const Hint = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin: 8px 0 12px 0;
    font-size: 12px;
    opacity: 0.85;
  }
`;

const Grid = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 10px;
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

const IpText = styled.div`
  .${({ theme }) => theme.namespace} & {
    font-size: 13px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    align-items: center;
  }
`;
