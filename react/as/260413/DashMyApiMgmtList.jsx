// 내가 등록한 API
import { useState, useMemo, useContext } from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { produce } from 'immer';
import { BasenameContext } from '@/utils/Context';
import { getRoutePath } from '@/utils/Str';
import {
  compareNumber,
  compareString,
  generateFiltersFromData,
  onFilter,
} from '@/utils/tableUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Table from '@/components/Organisms/Table';
import Select from '@/components/Atoms/Select';
import Highlight from '@/components/Atoms/Highlight';

const DashMyApiMgmtList = ({ searchTerm }) => {
  const pageSizeOptions = [
    { label: intlObj.get(message['store.pageSize10']), value: 10 },
    { label: intlObj.get(message['store.pageSize30']), value: 30 },
    { label: intlObj.get(message['store.pageSize50']), value: 50 },
    { label: intlObj.get(message['store.pageSize100']), value: 100 },
  ];

  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  // 카테고리 관련 상태
  const categoryState = useSelector((state) => state.get('category')) || {};
  const categoryLanguage = categoryState?.language;

  // 내가 등록한 API 리스트
  const myRegistState = useSelector((state) => state.get('dashboard')) || {};
  const listState = myRegistState?.list || {};
  const myRegistList = listState.myRegistList || [];
  const fetchMyRegistListLoading = listState.fetchMyRegistListLoading || false;

  const [sortFilter, setSortFilter] = useState('upd_dttm');
  const [pageSize, setPageSize] = useState(10);

  // 카테고리 필터 목록
  const categoryFilters = useMemo(
    () =>
      produce(generateFiltersFromData(myRegistList, 'catId'), (draft) => {
        for (const item of draft) {
          item.value = categoryLanguage?.[item.value];
          item.text = categoryLanguage?.[item.text];
        }
      }),
    [myRegistList, categoryLanguage],
  );

  // 상세 대시보드 페이지 링크 이동 핸들링  //지우고 set
  const navigateToDetail = (id, keyId, keyName) => {
    if (id) {
      // 로컬 스토리지에 데이터 저장
      const detailInfo = { keyId, keyName };
      localStorage.setItem('apiInfo', JSON.stringify(detailInfo));
      // 상태 전달과 함께 navigate 호출
      navigate(`${getRoutePath(basename, '/dashboard/detail/' + id)}`);
    }
  };

  // 데이터 정렬(최신 데이터 순)
  const sortedMyRegistList = useMemo(() => {
    if (!Array.isArray(myRegistList)) return [];
    return myRegistList;
  }, [myRegistList, sortFilter]);

  // 이스케이프 함수(모든 특수 문자 이스케이프)
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 검색어 하이라이팅
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const escapedSearchTerm = escapeRegExp(searchTerm);
    const parts = text.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <Highlight key={index}>{part}</Highlight>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  const tableColumns = [
    {
      title: intlObj.get(message['store.apiName']),
      dataIndex: 'svcNm',
      width: 'auto',
      resize: true,
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.svcNm, b?.svcNm, order),
      render: (text, record) => (
        <>
          {record?.svcType && record?.svcType !== 'API'
            ? `[${record?.svcType}] `
            : ''}
          {highlightText(text, searchTerm)}
        </>
      ),
    },
    {
      title: intlObj.get(message['store.category']),
      dataIndex: 'catNm',
      width: '15%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      filters: categoryFilters,
      onFilter: (value, record) =>
        onFilter(value, categoryLanguage?.[record?.catId]),
      sorter: (a, b, order) =>
        compareString(
          categoryLanguage?.[a?.catId],
          categoryLanguage?.[b?.catId],
          order,
        ),
      render: (text, record) => categoryLanguage?.[record?.catId] || '-',
    },
    {
      title: intlObj.get(message['store.apiListCount']),
      dataIndex: 'apiCount',
      width: '10%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareNumber(a?.apiCount, b?.apiCount, order),
      render: (text) => text,
    },
    {
      title: intlObj.get(message['store.subCount']),
      dataIndex: 'subCount',
      width: '10%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareNumber(a?.subCount, b?.subCount, order),
      render: (text) => text,
    },
    {
      title: intlObj.get(message['store.viewCount']),
      dataIndex: 'vwCnt',
      width: '10%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareNumber(a?.vwCnt, b?.vwCnt, order),
      render: (text) => text,
    },
    {
      title: intlObj.get(message['store.updDttm']),
      dataIndex: 'updDttm',
      width: '15%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.updDttm, b?.updDttm, order),
      render: (text) => {
        if (text) {
          return dayjs(text).format('YYYY.MM.DD');
        } else {
          return '-';
        }
      },
    },
  ];

  return (
    <>
      <Table
        rowKey={(record, index) => index.toString()}
        loading={fetchMyRegistListLoading}
        type={'normal'}
        columns={tableColumns}
        dataSource={sortedMyRegistList}
        pagination={{
          position: ['bottomCenter'],
          showAllItems: true,
          pageSize: pageSize,
        }}
        paginationExtraContent={
          <Select
            value={pageSize}
            options={pageSizeOptions}
            onSelect={(_, value) => setPageSize(value.value)}
          />
        }
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => {
            navigateToDetail(record?.svcId, record?.keyId, record?.keyName);
          },
        })}
        scroll={{ y: 500 }}
      />
    </>
  );
};

export default DashMyApiMgmtList;
