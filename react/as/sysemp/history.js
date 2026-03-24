import { forwardRef, useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchHistoryList,
  updateHistory,
} from '@/store/reduxStore/detail/reducer';
import { produce } from 'immer';
import { useToast } from '@/utils/ToastProvider';
import {
  compareString,
  generateFiltersFromData,
  onFilter,
} from '@/utils/tableUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Buttons from '@/components/Atoms/Buttons';
import Table from '@/components/Organisms/Table';
import Select from '@/components/Atoms/Select';
import Division from '@/components/Atoms/Division';
import User from '@/components/Organisms/User';
import Input from '@/components/Atoms/Input';
import Confirm from '@/components/Atoms/Confirm';

const defaultConfirm = {
  id: null,
  open: false,
};

const History = forwardRef((_, ref) => {
  const pageSizeOptions = [
    { label: intlObj.get(message['store.pageSize10']), value: 10 },
    { label: intlObj.get(message['store.pageSize30']), value: 30 },
    { label: intlObj.get(message['store.pageSize50']), value: 50 },
    { label: intlObj.get(message['store.pageSize100']), value: 100 },
  ];

  const { addToast } = useToast();

  const { svcId } = useParams();
  const dispatch = useDispatch();

  const profile = useSelector((state) => state.get('auth').get('profile'));

  const historyState =
    useSelector((state) => state.get('detail'))?.history || {};
  const historyList = historyState?.historyList || [];
  const fetchHistoryListLoading =
    historyState?.fetchHistoryListLoading || false;
  const updateSuccess = historyState?.updateSuccess || false;
  const updateLoading = historyState?.updateLoading || false;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingIds, setEditingIds] = useState([]);
  const [memos, setMemos] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(defaultConfirm);

  // table column filters
  // 내용 필터 목록
  const actFilters = useMemo(
    () => generateFiltersFromData(historyList, 'actNm'),
    [historyList],
  );
  // User 필터 목록
  const userFilters = useMemo(() => {
    const filters = new Set();
    for (const history of historyList) {
      const empNo = history?.empNo;
      const name = history?.nameKor;
      filters.add(empNo && name ? `${name} (${empNo})` : '-');
    }

    return [...filters].map((value) => ({
      text: value,
      value,
    }));
  }, [historyList]);

  // 이력 관리 목록 조회
  useEffect(() => {
    dispatch(fetchHistoryList({ svcId }));
  }, [svcId]);

  // 이력 관리 수정 시 목록 재조회
  useEffect(() => {
    if (updateSuccess) dispatch(fetchHistoryList({ svcId }));
  }, [svcId, updateSuccess]);

  // 목록 조회 시 메모 내용 초기화
  useEffect(() => {
    const newMemos = {};
    for (const history of historyList) {
      newMemos[history.actId] = history.memo;
    }
    setMemos(newMemos);
  }, [historyList]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // 메모 내용 업데이트 시 핸들링
  const handleUpdateMemo = (actId, updatedData) => {
    const nextData = produce(memos, (draft) => {
      draft[actId] = updatedData;
    });
    setMemos(nextData);
  };

  // 수정 모드로 전환 핸들링
  const handleSwitchEditingMode = (actId) => {
    const nextData = produce(editingIds, (draft) => {
      draft.push(actId);
    });
    setEditingIds(nextData);
  };

  // 메모 삭제 핸들링
  const handleDeleteMemo = (actId) => {
    dispatch(
      updateHistory({
        svcId,
        actId,
        memo: null,
      }),
    );
  };

  // 메모 저장 핸들링
  const handleSaveMemo = (actId) => {
    dispatch(
      updateHistory({
        svcId,
        actId,
        memo: memos[actId],
      }),
    );
    const nextData = produce(editingIds, (draft) => {
      return draft.filter((id) => id !== actId);
    });
    setEditingIds(nextData);
    addToast(intlObj.get(message['store.success.editMemo']), 'success');
  };

  // 메모 수정 취소 핸들링
  const handleCancelEditMemo = (actId) => {
    setMemos(
      produce(memos, (draft) => {
        const originMemo = historyList.find(
          (history) => history.actId === actId,
        );
        if (originMemo !== undefined) {
          draft[actId] = originMemo.memo;
        }
      }),
    );
    setEditingIds(
      produce(editingIds, (draft) => {
        return draft.filter((id) => id !== actId);
      }),
    );
    addToast(intlObj.get(message['store.success.cancelEditMemo']), 'success');
  };

  const tableColumns = [
    {
      title: 'No.',
      width: '9%',
      resize: true,
      align: 'center',
      render: (text, record, index) => {
        const startIndex = (page - 1) * pageSize;
        const globalIndex = startIndex + index;
        return historyList.length - globalIndex;
      },
    },
    {
      title: intlObj.get(message['store.historyDttm']),
      dataIndex: 'regDttm',
      width: '12%',
      resize: true,
      align: 'center',
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.regDttm, b?.regDttm, order),
      render: (text) => {
        if (text) {
          return dayjs(text).format('YYYY.MM.DD HH:mm');
        } else {
          return '-';
        }
      },
    },
    {
      title: intlObj.get(message['store.content']),
      dataIndex: 'actNm',
      width: '15%',
      resize: true,
      filters: actFilters,
      onFilter: (value, record) => onFilter(value, record?.actNm),
      render: (text) => text || '-',
    },
    {
      title: 'User',
      dataIndex: 'nameKor',
      width: '20%',
      resize: true,
      align: 'center',
      showSorterTooltip: false,
      sorter: (a, b, order) =>
        compareString(
          a?.nameKor && a?.empNo ? a?.nameKor + a?.empNo : undefined,
          b?.nameKor && b?.empNo ? b?.nameKor + b?.empNo : undefined,
          order,
        ),
      filters: userFilters,
      onFilter: (value, record) =>
        onFilter(
          value,
          record?.nameKor && record?.empNo
            ? `${record?.nameKor} (${record?.empNo})`
            : '-',
        ),
      render: (text, record) => (
        <User
          empNo={record?.empNo}
          name={record?.nameKor}
          email={record?.email}
          noPopup={record?.empNo === profile?.EMP_NO}
        />
      ),
    },
    {
      title: intlObj.get(message['store.memo']),
      dataIndex: 'memo',
      width: '37%',
      align: 'center',
      ellipsis: true,
      colSpan: 2,
      render: (text, record) => {
        const actId = record.actId;
        return editingIds.includes(actId) ? (
          <Division mb={20}>
            <Input.TextArea
              value={memos[actId]}
              onChange={(e) => handleUpdateMemo(actId, e.target.value)}
              placeholder={intlObj.get(message['store.placeholder.input.memo'])}
              autoSize={{ minRows: 1, maxRows: 2 }}
              maxLength={100}
              showCount={true}
            />
          </Division>
        ) : (
          <Memo>{text || '-'}</Memo>
        );
      },
    },
    {
      title: '',
      width: '7%',
      align: 'center',
      render: (text, record) => {
        const actId = record.actId;
        return editingIds.includes(actId) ? (
          <Division flex={true} justifyContent={'center'} gap={4}>
            <Buttons.IconSave onClick={() => handleSaveMemo(actId)} />
            <Buttons.IconCancel onClick={() => handleCancelEditMemo(actId)} />
          </Division>
        ) : (
          <Division flex={true} justifyContent={'center'} gap={4}>
            <Buttons.IconEdit onClick={() => handleSwitchEditingMode(actId)} />
            {record?.memo !== null && (
              <Buttons.IconDeleteRed
                onClick={() =>
                  setDeleteConfirm({
                    id: actId,
                    open: true,
                  })
                }
              />
            )}
          </Division>
        );
      },
    },
  ];

  return (
    <div ref={ref}>
      <ContentHeader
        title={intlObj.get(message['store.manageHistory'])}
        $border={true}
        spacing={20}
      />
      <Table
        rowKey={(record, index) => index.toString()}
        loading={fetchHistoryListLoading || updateLoading}
        columns={tableColumns}
        dataSource={historyList}
        pagination={{
          position: ['bottomCenter'],
          showAllItems: true,
          pageSize: pageSize,
          current: page,
          onChange: (page) => setPage(page),
        }}
        paginationExtraContent={
          <Select
            value={pageSize}
            options={pageSizeOptions}
            onSelect={(_, value) => setPageSize(value.value)}
          />
        }
        type={'normal'}
        scroll={{ y: 500 }}
      />
      <Confirm
        open={deleteConfirm.open}
        title={intlObj.get(message['store.deleteMemo'])}
        desc={intlObj.get(message['store.confirm.deleteMemo'])}
        onOk={() => {
          handleDeleteMemo(deleteConfirm.id);
          setDeleteConfirm(defaultConfirm);
        }}
        onCancel={() => setDeleteConfirm(defaultConfirm)}
        okText={intlObj.get(message['store.ok'])}
        cancelText={intlObj.get(message['store.cancel'])}
      />
    </div>
  );
});

export default History;

const Memo = styled.pre`
  white-space: pre-wrap;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
`;
