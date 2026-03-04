// components/Organisms/GridListEditor.jsx
import { useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import Division from '@/components/Atoms/Division';
import Buttons from '@/components/Atoms/Buttons';
import Input from '@/components/Atoms/Input';

/**
 * GridListEditor (재사용 컴포넌트)
 * - 상단 Input + 추가 버튼 1개
 * - 아래 N컬럼(기본 4) 그리드로 아이템을 "가로 우선" 배치
 * - 각 행: label(텍스트 or 수정 input) + [수정/삭제] 또는 [저장/취소]
 *
 * props:
 *  - columnsCount: number (default 4)
 *  - items: array
 *  - getKey: (item) => string|number
 *  - getLabel: (item) => string
 *  - placeholder: string
 *  - addButtonText: string
 *  - validateInput: (value) => { ok: boolean, message?: string }
 *  - normalizeInput: (value) => string
 *  - onAdd: (value) => void | Promise<void>
 *  - onUpdate: (item, newValue) => void | Promise<void>
 *  - onDelete: (item) => void | Promise<void>
 *  - loadingAdd / loadingUpdate / loadingDelete: boolean
 *  - disabled: boolean
 */
const GridListEditor = ({
  columnsCount = 4,
  items = [],
  getKey,
  getLabel,
  placeholder = '',
  addButtonText = '추가',
  validateInput = () => ({ ok: true }),
  normalizeInput = (v) => (v || '').trim(),
  onAdd,
  onUpdate,
  onDelete,
  loadingAdd = false,
  loadingUpdate = false,
  loadingDelete = false,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // "가로 우선"으로 4단 배치하기 위해 컬럼별 배열로 분배
  const columns = useMemo(() => {
    const cols = Array.from({ length: columnsCount }, () => []);
    items.forEach((item, idx) => {
      cols[idx % columnsCount].push(item);
    });
    return cols;
  }, [items, columnsCount]);

  const startEdit = useCallback(
    (item) => {
      const key = getKey(item);
      setEditingKey(key);
      setEditingValue(getLabel(item));
    },
    [getKey, getLabel],
  );

  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditingValue('');
  }, []);

  const handleAdd = useCallback(() => {
    if (disabled || loadingAdd) return;

    const raw = inputValue;
    const normalized = normalizeInput(raw);
    const v = validateInput(normalized);

    if (!normalized) return;
    if (!v?.ok) return;

    onAdd?.(normalized);
    setInputValue('');
  }, [
    disabled,
    loadingAdd,
    inputValue,
    normalizeInput,
    validateInput,
    onAdd,
  ]);

  const handleSave = useCallback(
    (item) => {
      if (disabled || loadingUpdate) return;

      const normalized = normalizeInput(editingValue);
      const v = validateInput(normalized);

      if (!normalized) return;
      if (!v?.ok) return;

      onUpdate?.(item, normalized);
      cancelEdit();
    },
    [
      disabled,
      loadingUpdate,
      editingValue,
      normalizeInput,
      validateInput,
      onUpdate,
      cancelEdit,
    ],
  );

  const handleDelete = useCallback(
    (item) => {
      if (disabled || loadingDelete) return;
      onDelete?.(item);
    },
    [disabled, loadingDelete, onDelete],
  );

  return (
    <Wrap>
      {/* 상단 입력 + 추가 버튼(한 번만) */}
      <Division flex={true} gap={10} alignItems={'center'}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          maxWidth={350}
          disabled={disabled || loadingAdd}
        />
        <Buttons.Outlined
          type={'grey'}
          onClick={handleAdd}
          minWidth="80"
          disabled={disabled || loadingAdd}
        >
          {loadingAdd ? '추가 중...' : addButtonText}
        </Buttons.Outlined>
      </Division>

      <Grid>
        {columns.map((colItems, colIdx) => (
          <Col key={`col-${colIdx}`}>
            {colItems.map((item) => {
              const key = getKey(item);
              const label = getLabel(item);
              const isEditing = editingKey === key;

              return (
                <Row key={key}>
                  <Left>
                    {isEditing ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        maxLength={100}
                        disabled={disabled || loadingUpdate}
                      />
                    ) : (
                      <IpText title={label}>{label}</IpText>
                    )}
                  </Left>

                  <Right>
                    {isEditing ? (
                      <Division flex={true} gap={4} justifyContent={'center'}>
                        <Buttons.IconSave
                          onClick={() => handleSave(item)}
                        />
                        <Buttons.IconCancel
                          onClick={cancelEdit}
                        />
                      </Division>
                    ) : (
                      <Division flex={true} gap={4} justifyContent={'center'}>
                        <Buttons.IconEdit onClick={() => startEdit(item)} />
                        <Buttons.IconDeleteRed onClick={() => handleDelete(item)} />
                      </Division>
                    )}
                  </Right>
                </Row>
              );
            })}
          </Col>
        ))}
      </Grid>
    </Wrap>
  );
};

const Wrap = styled.div`
  width: 100%;
`;

const Grid = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 12px;
  width: 100%;
`;

const Col = styled.div`
  flex: 1;
  min-width: 0;
  border: 1px solid #dddddd;
  border-radius: 10px;
  overflow: hidden;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-bottom: 1px solid #eeeeee;

  &:last-child {
    border-bottom: none;
  }
`;

const Left = styled.div`
  flex: 1;
  min-width: 0;
`;

const Right = styled.div`
  width: 64px;
  display: flex;
  justify-content: flex-end;
`;

const IpText = styled.div`
  font-size: 13px;
  font-weight: 300;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default GridListEditor;