import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTabKey,
  fetchAdminList,
  fetchMySubscribeList,
  fetchMyRegistList,
} from '@/store/reduxStore/dashboard/reducer';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import SearchBox from '@/components/Atoms/SearchBox';
import Tabs from '@/components/Organisms/Tabs';
import DashMyApiMgmtList from './apiMgmtList';
import DashMySubList from './subList';
import AdminList from './adminList';

const DashList = () => {
  const dispatch = useDispatch();
  const isAdminState = useSelector((state) => state.get('permission')) || {};
  const isAdmin = isAdminState?.isAdmin || {};

  const [page, setPage] = useState(1);
  const [activeTabKey, setActiveTabKey] = useState(
    useSelector((state) => state.get('dashboard'))?.activeTabKey || 'myApiMgmt',
  );

  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [registSearchTerm, setRegistSearchTerm] = useState('');

  // 초기 데이터 로딩
  useEffect(() => {
    dispatch(fetchMyRegistList());
  }, []);

  // 탭 변경 핸들링
  const handleTabChange = (key) => {
    setActiveTabKey(key);
    dispatch(setTabKey(key));

    // 검색어 초기화
    if (key === 'admin') {
      setAdminSearchTerm('');
      dispatch(
        fetchAdminList({
          search: '',
        }),
      );
    } else if (key === 'subApi') {
      setSubSearchTerm('');
      dispatch(
        fetchMySubscribeList({
          search: '',
        }),
      );
    } else if (key === 'myApiMgmt') {
      setRegistSearchTerm('');
      dispatch(
        fetchMyRegistList({
          search: '',
        }),
      );
    }

    setPage(1);
  };

  // 검색어 변경 핸들링
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (activeTabKey === 'admin') {
      setAdminSearchTerm(value);
    } else if (activeTabKey === 'subApi') {
      setSubSearchTerm(value);
    } else if (activeTabKey === 'myApiMgmt') {
      setRegistSearchTerm(value);
    }
  };

  // 검색 핸들링
  const handleSearch = async () => {
    if (activeTabKey === 'admin') {
      dispatch(
        fetchAdminList({
          search: adminSearchTerm.toLowerCase(),
        }),
      );
    } else if (activeTabKey === 'subApi') {
      dispatch(
        fetchMySubscribeList({
          search: subSearchTerm.toLowerCase(),
        }),
      );
    } else if (activeTabKey === 'myApiMgmt') {
      dispatch(
        fetchMyRegistList({
          search: registSearchTerm.toLowerCase(),
        }),
      );
    }
    setPage(1);
  };

  // x 아이콘 클릭시
  const handleCancelSearch = () => {
    if (activeTabKey === 'admin') {
      setAdminSearchTerm('');
      dispatch(
        fetchAdminList({
          search: '',
        }),
      );
    } else if (activeTabKey === 'subApi') {
      setSubSearchTerm('');
      dispatch(
        fetchMySubscribeList({
          search: '',
        }),
      );
    } else if (activeTabKey === 'myApiMgmt') {
      setRegistSearchTerm('');
      dispatch(
        fetchMyRegistList({
          search: '',
        }),
      );
    }
    setPage(1);
  };

  const items = [
    ...(isAdmin === 'Y'
      ? [
          {
            key: 'admin',
            label: intlObj.get(message['store.totalApi']),
            children: <AdminList searchTerm={adminSearchTerm} />,
          },
        ]
      : []),
    {
      key: 'subApi',
      label: intlObj.get(message['store.mySubApi']),
      children: <DashMySubList searchTerm={subSearchTerm} />,
    },
    {
      key: 'myApiMgmt',
      label: intlObj.get(message['store.myRegistApi']),
      children: <DashMyApiMgmtList searchTerm={registSearchTerm} />,
    },
  ];

  return (
    <>
      <SearchBox
        onChange={handleSearchChange}
        onSearch={handleSearch}
        onCancel={handleCancelSearch}
        value={
          activeTabKey === 'admin'
            ? adminSearchTerm
            : activeTabKey === 'subApi'
              ? subSearchTerm
              : registSearchTerm
        }
        bottom={'20px'}
      />
      <Tabs
        className={'listTab'}
        items={items}
        onChange={handleTabChange}
        border={true}
        spacing={20}
        activeKey={activeTabKey}
        destroyInactiveTabPane={true}
      />
    </>
  );
};

export default DashList;
