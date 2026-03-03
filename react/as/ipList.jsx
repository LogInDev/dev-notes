import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '@/store/reduxStore/regist/reducer';
import { useToast } from '@/utils/ToastProvider';
import { produce } from 'immer';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Buttons from '@/components/Atoms/Buttons';
import Input from '@/components/Atoms/Input';
import Division from '@/components/Atoms/Division';
import Confirm from '@/components/Atoms/Confirm';
import Ellipsis from '@/components/Atoms/Ellipsis';
import CollapseTable from '@/components/Organisms/CollapseTable';

/**
 * [CHANGED] IP 리스트(단일 IP / 대역 "~") 관리 컴포넌트
 * - 3단(가로 3개 테이블) 구성
 * - 각 단 상단: 입력 + 추가
 * - 각 행: IP + (수정/삭제) 또는 (저장/취소)
 */

/** [CHANGED] 기본 삭제 컨펌 */
const defaultDeleteConfirm = {
  open: false,
  targetId: undefined,
};

/** [CHANGED] IPv4 유틸 */
const isValidIpv4 = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (p.trim() === '') return false;
    // leading zero 허용 여부는 조직 정책마다 다름.
    // 여기서는 "숫자"만 체크하고 범위만 제한(0~255) -> 실무에서 흔한 방식
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    if (Number.isNaN(n) || n < 0 || n > 255) return false;
  }
  return true;
};

const ipv4ToInt = (ip) => {
  const [a, b, c, d] = ip.split('.').map((v) => Number(v));
  // >>> 0 으로 unsigned 처리
  return (((a << 24) | (b << 16) | (c << 8) | d) >>> 0);
};

/**
 * [CHANGED] 입력값 정규화 & 검증
 * - 단일: "1.2.3.4"
 * - 대역: "1.2.3.4~1.2.3.20"
 * - 공백은 모두 제거
 * - 대역은 start <= end
 */
const normalizeAndValidateIpExpression = (raw) => {
  const value = (raw || '').replace(/\s/g, ''); // 공백 제거
  if (value === '') {
    return { ok: false, normalized: '', type: 'empty', messageKey: 'store.placeholder.input.ip' };
  }

  if (value.includes('~')) {
    const [start, end, ...rest] = value.split('~');
    if (rest.length > 0) {
      return { ok: false, normalized: value, type: 'invalid', message: '대역 형식이 올바르지 않습니다. (예: 10.0.0.1~10.0.0.10)' };
    }
    if (!start || !end) {
      return { ok: false, normalized: value, type: 'invalid', message: '대역 시작/끝 IP를 모두 입력해주세요.' };
    }
    if (!isValidIpv4(start) || !isValidIpv4(end)) {
      return { ok: false, normalized: value, type: 'invalid', message: '유효한 IPv4 형식이 아닙니다. (예: 10.0.0.1~10.0.0.10)' };
    }
    const s = ipv4ToInt(start);
    const e = ipv4ToInt(end);
    if (s > e) {
      return { ok: false, normalized: value, type: 'invalid', message: '대역 시작 IP가 끝 IP보다 클 수 없습니다.' };
    }
    return { ok: true, normalized: `${start}~${end}`, type: 'range' };
  }

  // 단일 IP
  if (!isValidIpv4(value)) {
    return { ok: false, normalized: value, type: 'invalid', message: '유효한 IPv4 형식이 아닙니다. (예: 10.0.0.1)' };
  }
  return { ok: true, normalized: value, type: 'single' };
};

/** [CHANGED] 3단 분배: index % 3 로 고르게 배치(성능/단순/일관) */
const splitIntoThreeColumns = (list) => {
  const col0 = [];
  const col1 = [];
  const col2 = [];
  for (let i = 0; i < list.length; i += 1) {
    const t = i % 3;
    if (t === 0) col0.push(list[i]);
    else if (t === 1) col1.push(list[i]);
    else col2.push(list[i]);
  }
  return [col0, col1, col2];
};

const IpList = () => {
  const { addToast } = useToast();
  const dispatch = useDispatch();

  const detailState =
    useSelector((state) => state.get('regist'))?.form?.detail || {};

  // =========================
  // [CHANGED] 기존 apiList -> ipList 로 변경
  // 필요하면 여기만 apiList로 되돌리면 됨
  // =========================
  const ipList = detailState?.ipList || [];

  // [CHANGED] 입력 폼을 3단 각각 따로 유지(성능 + UX)
  const [inputByColumn, setInputByColumn] = useState(['', '', '']);

  // [CHANGED] 수정중인 항목: { id, value }
  const [editing, setEditing] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(defaultDeleteConfirm);

  // Redux State Update
  const handleUpdateDetailState = (field, updatedData) => {
    dispatch(updateField({ field: `form.detail.${field}`, value: updatedData }));
  };

  /** [CHANGED] 중복 체크용: normalized 기준 Set */
  const normalizedSet = useMemo(() => {
    const s = new Set();
    for (const item of ipList) {
      // item: { id, value }
      s.add(item?.value);
    }
    return s;
  }, [ipList]);

  /** [CHANGED] 3단 분배 데이터 */
  const [col0, col1, col2] = useMemo(
    () => splitIntoThreeColumns(ipList),
    [ipList],
  );

  /** [CHANGED] 컬럼별 테이블 데이터(각 테이블 맨 위에 input row 삽입) */
  const tableDataByColumn = useMemo(() => {
    const makeFirstRow = (colIndex) => ({
      id: `__input__${colIndex}`,
      type: 'input',
      value: '',
      expandable: false,
      colIndex,
    });

    return [
      [makeFirstRow(0), ...col0],
      [makeFirstRow(1), ...col1],
      [makeFirstRow(2), ...col2],
    ];
  }, [col0, col1, col2]);

  /** [CHANGED] 입력 변경 */
  const handleChangeInput = (colIndex, next) => {
    setInputByColumn((prev) =>
      produce(prev, (draft) => {
        draft[colIndex] = next;
      }),
    );
  };

  /** [CHANGED] 추가 */
  const handleAddIp = (colIndex) => {
    const raw = inputByColumn[colIndex];
    const validated = normalizeAndValidateIpExpression(raw);

    if (!validated.ok) {
      if (validated.messageKey) {
        addToast(intlObj.get(message[validated.messageKey]), 'error');
      } else {
        addToast(validated.message || intlObj.get(message['store.validation.input']), 'error');
      }
      return;
    }

    if (normalizedSet.has(validated.normalized)) {
      // 중복
      addToast(intlObj.get(message['store.validation.duplicate']), 'error');
      return;
    }

    const nextData = produce(ipList, (draft) => {
      // id는 안정적으로 value 기반(중복 방지와도 일치)
      draft.push({
        id: validated.normalized,
        value: validated.normalized,
      });
    });

    handleUpdateDetailState('ipList', nextData); // [CHANGED]
    handleChangeInput(colIndex, '');
    addToast(intlObj.get(message['store.success.add']), 'success');
  };

  /** [CHANGED] 수정 시작 */
  const handleStartEdit = (record) => {
    setEditing({ id: record.id, value: record.value });
  };

  /** [CHANGED] 수정 취소 */
  const handleCancelEdit = () => {
    setEditing(null);
    addToast(intlObj.get(message['store.success.cancelEditApi']), 'success');
  };

  /** [CHANGED] 수정 저장 */
  const handleSaveEdit = () => {
    if (!editing) return;

    const validated = normalizeAndValidateIpExpression(editing.value);
    if (!validated.ok) {
      addToast(validated.message || intlObj.get(message['store.validation.input']), 'error');
      return;
    }

    // 자기 자신 제외 중복 검사
    const isDuplicated =
      validated.normalized !== editing.id && normalizedSet.has(validated.normalized);

    if (isDuplicated) {
      addToast(intlObj.get(message['store.validation.duplicate']), 'error');
      return;
    }

    const nextData = produce(ipList, (draft) => {
      const idx = draft.findIndex((x) => x.id === editing.id);
      if (idx >= 0) {
        draft[idx].id = validated.normalized;
        draft[idx].value = validated.normalized;
      }
    });

    handleUpdateDetailState('ipList', nextData); // [CHANGED]
    setEditing(null);
    addToast(intlObj.get(message['store.success.editApi']), 'success');
  };

  /** [CHANGED] 삭제 */
  const handleDelete = (id) => {
    const nextData = produce(ipList, (draft) => draft.filter((x) => x.id !== id));
    handleUpdateDetailState('ipList', nextData); // [CHANGED]
    addToast(intlObj.get(message['store.success.deleteApi']), 'success');
  };

  /** [CHANGED] 각 테이블(컬럼)에서 공통으로 쓰는 columns */
  const makeColumns = (colIndex) => {
    return [
      {
        title: 'IP',
        dataIndex: 'value',
        key: 'value',
        ellipsis: true,
        width: 'auto',
        resize: true,
        render: (_, record) => {
          // input row
          if (record.type === 'input') {
            return (
              <Division flex={true} gap={10} alignItems={'center'}>
                <Input
                  value={inputByColumn[colIndex]}
                  placeholder={'예: 10.0.0.1 또는 10.0.0.1~10.0.0.10'}
                  onChange={(e) => handleChangeInput(colIndex, e.target.value)}
                  maxLength={40}
                  showCount={true}
                />
              </Division>
            );
          }

          // editing row
          if (editing?.id === record.id) {
            return (
              <Division flex={true} gap={10} alignItems={'center'}>
                <Input
                  value={editing.value}
                  placeholder={'예: 10.0.0.1 또는 10.0.0.1~10.0.0.10'}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, value: e.target.value }))
                  }
                  maxLength={40}
                  showCount={true}
                />
              </Division>
            );
          }

          return (
            <Division flex={true} gap={10} alignItems={'center'}>
              <Ellipsis>{record.value}</Ellipsis>
            </Division>
          );
        },
        onCell: () => ({
          style: { paddingLeft: 0 },
        }),
      },
      {
        title: intlObj.get(message['store.manage']),
        dataIndex: 'manage',
        key: 'manage',
        ellipsis: true,
        align: 'center',
        width: '110px',
        resize: true,
        render: (_, record) => {
          // input row: add button
          if (record.type === 'input') {
            return (
              <Buttons.Outlined
                type={'grey'}
                onClick={() => handleAddIp(colIndex)}
              >
                {intlObj.get(message['store.add'])}
              </Buttons.Outlined>
            );
          }

          // editing row: save/cancel
          if (editing?.id === record.id) {
            return (
              <Division flex={true} gap={4} justifyContent={'center'}>
                <Buttons.IconSave
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                />
                <Buttons.IconCancel
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                />
              </Division>
            );
          }

          // normal row: edit/delete
          return (
            <Division flex={true} gap={4} justifyContent={'center'}>
              <Buttons.IconEdit
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(record);
                }}
              />
              <Buttons.IconDeleteRed
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm({ open: true, targetId: record.id });
                }}
              />
            </Division>
          );
        },
        onCell: () => ({
          onClick: (e) => e.stopPropagation(),
        }),
      },
    ];
  };

  return (
    <>
      {/* [CHANGED] 3단(가로 3개 테이블) */}
      <Division flex={true} gap={12} alignItems={'flex-start'}>
        {[0, 1, 2].map((colIndex) => (
          <div key={colIndex} style={{ width: 'calc(33.333% - 8px)' }}>
            <CollapseTable
              // [CHANGED] 각 컬럼별 rowKey 안정화
              rowKey={(record) => record.id}
              columns={makeColumns(colIndex)}
              data={tableDataByColumn[colIndex]}
              // [CHANGED] 각 단은 "간단 리스트"가 목적이라 pagination은 끔 (3단에서 pagination하면 UX/성능 둘 다 애매)
              // 만약 꼭 필요하면 전체 ipList 기준으로 상단 1개 pagination을 따로 두는 걸 추천
              pagination={false}
            />
          </div>
        ))}
      </Division>

      <Confirm
        open={deleteConfirm?.open}
        title={intlObj.get(message['store.deleteApi'])}
        desc={intlObj.get(message['store.confirm.deleteApi'])}
        okText={intlObj.get(message['store.ok'])}
        cancelText={intlObj.get(message['store.cancel'])}
        onOk={() => {
          handleDelete(deleteConfirm?.targetId);
          setDeleteConfirm(defaultDeleteConfirm);
        }}
        onCancel={() => setDeleteConfirm(defaultDeleteConfirm)}
      />
    </>
  );
};

export default IpList;