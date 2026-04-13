import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import dayjs from 'dayjs';
import { compareString, compareWithPriority } from '@/utils/tableUtils';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Select from '@/components/Atoms/Select';
import Modal from '@/components/Organisms/Modal';
import Table from '@/components/Organisms/Table';
import Checkbox from '@/components/Atoms/Checkbox';
import Radio from '@/components/Atoms/Radio';
import NoData from '@/components/Atoms/NoData';
import Division from '@/components/Atoms/Division';

// Key 타입에 대한 정렬 및 필터 박스 노출 우선순위
const keyTypePriority = {
  PSN: 1,
  SYS: 2,
};

const pageSize = 5;

// Admin일 때 key리스트
const getAPIKeyList = async (searchAll) => {
  const response = await axios.post(
    `${import.meta.env.VITE_REACT_APP_API_STORE_URL}/api-keys/list`,
    { searchAll }, // params 객체 내부에 searchAll 전달
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

// 새로운 API 호출 함수
const axiosGetApiKey = async (svcId) => {
  const response = await axios.get(
    `${process.env.VITE_REACT_APP_API_STORE_URL}/dashboard/store/apiKeyList`,
    {
      params: {
        svcId,
      },
    },
  );
  if (!response.status || response.status < 200 || response.status >= 300)
    throw new Error(response);
  return response;
};

const DashKeyModal = ({
  open,
  onOk,
  onCancel,
  value,
  width = 970,
  type = 'radio',
  keyId,
  svcId,
}) => {
  const keyTypeOptions = [
    {
      key: 'ALL',
      value: 'ALL',
      label: intlObj.get(message['store.totalList']),
    },
    { key: 'PSN', value: 'PSN', label: intlObj.get(message['store.personal']) },
    { key: 'SYS', value: 'SYS', label: intlObj.get(message['store.system']) },
  ];

  const [keyList, setKeyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [systemFilter, setSystemFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [keyFilter, setKeyFilter] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  //관리자
  const permissionState = useSelector((state) => state.get('permission')) || {};
  const isAdmin = permissionState?.isAdmin === 'Y';
  //전체 조회 체크 박스
  const [searchAll, setSearchAll] = useState(false);
  const [isAllCheck, setIsAllCheck] = useState(false);

  // 선택 값 초기화
  useEffect(() => {
    if (open) {
      if (type === 'radio') {
        // value가 변경되었을 때 selectedKey 업데이트
        if (value !== undefined && value !== null) {
          setSelectedKey(value);
        } else {
          setSelectedKey(null);
        }
      } else if (type === 'checkbox') {
        setSelectedKeys(value || []);
      }
    }
  }, [open, value, type]);

  // 전체 조회 체크박스 변경 시
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        if (isAllCheck) {
          // 관리자 권한으로 모든 키 조회
          const response = await getAPIKeyList(true);
          const transformedData = response.data.response.map((item) => ({
            keyId: item.keyId,
            keyName: item.keyName,
            keyDesc: item.keyDesc,
            appNm: item.appNm,
            prjId: item.prjId,
            authCd:
              item.keyType === '시스템'
                ? 'SYS'
                : item.keyType === '개인'
                  ? 'PSN'
                  : '-',
            regUserNm: item.ownerNm,
            regUserId: item.ownerId,
            regDttm: item.regDttm,
            svcId: item.svcId,
            keyType: item.keyType,
          }));
          setKeyList(transformedData);
        } else {
          // 일반 사용자 권한으로 키 조회
          const response = await axiosGetApiKey(svcId);
          // API 응답 데이터 구조에 맞게 변환
          const transformedData = response.data.response.map((item) => ({
            keyId: item.keyId,
            keyName: item.keyName,
            keyDesc: item.keyDesc,
            appNm: item.appNm,
            prjId: item.prjId,
            authCd: item.authCd,
            regUserNm: item.regUserNm,
            regUserId: item.ownerId,
            regDttm: item.regDttm,
            svcId: item.svcId,
            // keyType 필드 추가 - 관리자 권한이 아닌 경우에도 keyType 계산 필요
            keyType:
              item.authCd === 'SYS'
                ? '시스템'
                : item.authCd === 'PSN'
                  ? '개인'
                  : '-',
          }));
          setKeyList(transformedData);
        }
      } catch (error) {
        setKeyList([]);
      }
    };

    if (open) {
      fetchKeys();
    }
  }, [isAllCheck, open, svcId]);

  // 프로젝트 목록 추출
  const projectOptions = useMemo(() => {
    const projects = new Set(keyList.map((key) => key.prjId));
    return Array.from(projects)
      .map((prjId) => ({
        key: prjId,
        value: prjId,
        label: prjId,
      }))
      .filter((option) => option.key !== undefined);
  }, [keyList]);

  // 시스템 목록 추출
  const systemOptions = useMemo(() => {
    const systems = new Set(
      keyList
        .map((key) => key.appNm)
        .filter((item) => item !== undefined && item !== null),
    );
    return Array.from(systems).map((appNm) => ({
      key: appNm,
      value: appNm,
      label: appNm,
    }));
  }, [keyList]);

  // 모든 필터 결합
  const finalFilteredKeyList = useMemo(() => {
    let filteredList = keyList;
    // 키
    if (keyFilter && keyFilter !== 'ALL') {
      filteredList = filteredList.filter((key) => key.authCd === keyFilter);
    }
    // 프로젝트
    if (projectFilter !== '') {
      filteredList = filteredList.filter((key) => key.prjId === projectFilter);
    }
    // 시스템
    if (systemFilter !== '') {
      filteredList = filteredList.filter((key) => key.appNm === systemFilter);
    }
    return filteredList;
  }, [keyList, keyFilter, projectFilter, systemFilter]);

  const handleOk = () => {
    if (type === 'radio') {
      // 선택된 키가 있을 경우에만 전달
      if (selectedKey) {
        onOk(selectedKey);
      } else {
        // 아무것도 선택되지 않았을 경우 null 또는 빈 객체 전달
        onOk(null);
      }
    } else {
      const selectedKeyIds = selectedKeys.map((item) => item.keyId);
      onOk(selectedKeyIds);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleAllList = (e) => {
    const checked = e.target.checked;
    setIsAllCheck(checked);
    setSearchAll(checked);
  };

  const columns = [
    {
      title: intlObj.get(message['store.keyName']),
      dataIndex: 'keyName',
      key: 'keyName',
      width: 'auto',
      resize: true,
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.keyName, b?.keyName, order),
      render: (text, record) =>
        type === 'radio' ? (
          <Radio
            style={{ width: '100%' }}
            value={record}
            checked={record.keyId === selectedKey?.keyId}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            {text}
          </Radio>
        ) : type === 'checkbox' ? (
          <Checkbox
            style={{ width: '100%' }}
            value={record.keyId}
            checked={selectedKeys.some((item) => item.keyId === record.keyId)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedKeys([...selectedKeys, record]);
              } else {
                setSelectedKeys(
                  selectedKeys.filter((item) => item.keyId !== record.keyId),
                );
              }
            }}
          >
            {text}
          </Checkbox>
        ) : null,
    },
    {
      title: intlObj.get(message['store.keyDesc']),
      dataIndex: 'keyDesc',
      key: 'keyDesc',
      width: 'auto',
      resize: true,
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.keyDesc, b?.keyDesc, order),
    },
    {
      title: intlObj.get(message['store.project']),
      dataIndex: 'prjId',
      width: '14%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.prjId, b?.prjId, order),
    },
    {
      title: intlObj.get(message['store.type']),
      dataIndex: 'authCd',
      width: '14%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.authCd, b?.authCd, order),
      render: (text, record) => {
        const keyType = record?.keyType;
        return keyType === '시스템'
          ? intlObj.get(message['store.system'])
          : keyType === '개인'
            ? intlObj.get(message['store.personal'])
            : '-';
      },
    },
    {
      title: intlObj.get(message['store.keyConnectionInfo']),
      dataIndex: 'keyInfo',
      width: '21%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => {
        if (a?.authCd !== undefined && a.authCd === b.authCd) {
          if (a.authCd === 'PSN') {
            return compareString(
              a?.regUserNm && a?.regUserId
                ? a?.regUserNm + a?.regUserId
                : undefined,
              b?.regUserNm && b?.regUserId
                ? b?.regUserNm + b?.regUserId
                : undefined,
              order,
            );
          } else if (a.authCd === 'SYS') {
            return compareString(a?.appNm, b?.appNm, order);
          }
        } else {
          return compareWithPriority(
            a?.authCd,
            b?.authCd,
            order,
            keyTypePriority,
          );
        }
      },
      render: (text, record) => {
        const regNm = record?.regUserNm;
        const regId = record?.regUserId;
        const hydeskSys = record?.appNm;
        const auth =
          record?.keyType === '개인'
            ? regNm && regId
              ? `${regNm} (${regId})`
              : undefined
            : record?.keyType === '시스템'
              ? hydeskSys
              : undefined;
        return auth || '-';
      },
    },
    {
      title: intlObj.get(message['store.regDttm']),
      dataIndex: 'regDttm',
      width: '14%',
      resize: true,
      align: 'center',
      ellipsis: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.regDttm, b?.regDttm, order),
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
    <Modal
      title={intlObj.get(message['store.selectKey'])}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose={true}
      okText={intlObj.get(message['store.save'])}
      cancelText={intlObj.get(message['store.cancel'])}
      height={530}
      bodyStyle={{
        height: '420px',
        maxHeight: '420px',
      }}
      width={width}
    >
      <Division flex={true} alignItems={'center'} gap={8} mb={10}>
        {/* 시스템 */}
        <Select
          width={200}
          options={systemOptions}
          value={systemFilter || undefined}
          allowClear={true}
          autoClearSearchValue={true}
          onSelect={(value) => setSystemFilter(value)}
          onClear={() => setSystemFilter('')}
          placeholder={intlObj.get(message['store.system'])}
          notFoundContent={
            <NoData title={intlObj.get(message['store.noData'])} />
          }
        />
        {/* 프로젝트 */}
        <Select
          width={200}
          options={projectOptions}
          value={projectFilter || undefined}
          allowClear={true}
          autoClearSearchValue={true}
          onSelect={(value) => setProjectFilter(value)}
          onClear={() => setProjectFilter('')}
          placeholder={intlObj.get(message['store.project'])}
          notFoundContent={
            <NoData title={intlObj.get(message['store.noData'])} />
          }
        />
        {/* key타입 */}
        <Select
          width={200}
          options={keyTypeOptions}
          value={keyFilter || undefined}
          allowClear={true}
          autoClearSearchValue={true}
          onSelect={(value) => setKeyFilter(value)}
          onClear={() => setKeyFilter('')}
          placeholder={intlObj.get(message['store.keyType'])}
          notFoundContent={
            <NoData title={intlObj.get(message['store.noData'])} />
          }
        />
        {isAdmin && (
          <Checkbox checked={isAllCheck} onChange={handleAllList}>
            <Division.SubTitle>
              {intlObj.get(message['store.viewAll'])}
            </Division.SubTitle>
          </Checkbox>
        )}
      </Division>
      <Table
        rowKey={'keyId'}
        columns={columns}
        dataSource={finalFilteredKeyList}
        type="normal"
        placeholderBorder={false}
        loading={loading}
        pagination={{
          position: ['bottomCenter'],
          showAllItems: true,
          pageSize: pageSize,
        }}
      />
    </Modal>
  );
};

export default DashKeyModal;
