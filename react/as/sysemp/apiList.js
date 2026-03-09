
apiList에 있는 저장버튼을 눌러서 handleSaveKey를 실행시키면 선택된 키의 authCd가  SYS 키이면 db에서 매핑된 시스템 사번 보여주고 매핑된 시스템 사번 없으면 input란 보여줘서 시스템 사번 작성하고 유효성 검사 버튼 클릭해서 유효성 검사 할 수 있도록 하는건데
그게 적용안되어있어.
그리고 처음 detail화면 열 때도 선택된 키의 authCd를 확인하고 SYS면 위 로직 진행하게 해야해


import { forwardRef, useContext, useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { produce } from 'immer';
import {
  fetchApiList,
  updateField as updateListField,
} from '@/store/reduxStore/detail/reducer';
import { updateField as updateKeyField } from '@/store/reduxStore/keySelect/reducer';
import { BasenameContext } from '@/utils/Context';
import { getRoutePath } from '@/utils/Str';
import { compareString } from '@/utils/tableUtils';
import { useToast } from '@/utils/ToastProvider';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import Division from '@/components/Atoms/Division';
import Ellipsis from '@/components/Atoms/Ellipsis';
import Method from '@/components/Atoms/Method';
import Buttons from '@/components/Atoms/Buttons';
import Checkbox from '@/components/Atoms/Checkbox';
import Select from '@/components/Atoms/Select';
import CollapseTable from '@/components/Organisms/CollapseTable';
import ContentHeader from '@/components/Organisms/ContentHeader';
import Selector from '@/components/Organisms/Selector';
import ApplyKey from '@/components/Atoms/ApplyKey';
import KeyModal from '@/components/Templates/KeyModal';
import QosForm from '@/components/Organisms/QosForm';
import TestConsole from './TestConsole';

const ensureProtocol = (url) => {
  // 정규 표현식을 사용하여 URL이 http 또는 https로 시작하는지 확인
  const regex = /^(http:\/\/|https:\/\/)/i;
  if (!regex.test(url)) {
    // 프로토콜이 없으면 http://를 붙임
    return `http://${url}`;
  }
  return url;
};

const getGatewayPrefix = (svcType, svcId) => {
  return svcType === 'API' ? `/a${svcId}` : '';
};

const getStgGatewayUrl = (svcType) => {
  const env =
    svcType === 'API'
      ? 'basic'
      : svcType === 'CTS'
        ? 'cts'
        : svcType === 'LLM'
          ? 'llm'
          : '';
  return `hcp-arch-gateway-${env}-stg.api.hcpd03.skhynix.com`;
};

const defaultPageSize = 10;

const ApiList = forwardRef((_, ref) => {
  const pageSizeOptions = [
    { label: intlObj.get(message['store.pageSize10']), value: 10 },
    { label: intlObj.get(message['store.pageSize30']), value: 30 },
    { label: intlObj.get(message['store.pageSize50']), value: 50 },
    { label: intlObj.get(message['store.pageSize100']), value: 100 },
  ];

  const { addToast } = useToast();

  const { svcId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basename = useContext(BasenameContext);

  const listState = useSelector((state) => state.get('detail'))?.list || {};
  const apiList = listState?.apiList || [];
  const checkedList = listState?.checkedList || [];
  const fetchApiListLoading = listState?.fetchApiListLoading || false;
  const isSubscriptionApprovalPending = useMemo(
    () => apiList.some((api) => api?.subStat === 'APR'),
    [apiList],
  );
  const checkableApiList = useMemo(
    () =>
      apiList.filter(
        (api) =>
          api.subStat === 'N' || api.subStat === 'REJ' || api.subStat === 'CCL',
      ),
    [apiList],
  );
  const isCheckedAll = useMemo(
    () => checkedList.length === checkableApiList.length,
    [checkableApiList, checkedList],
  );

  const detailState = useSelector((state) => state.get('detail'))?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const serviceType = serviceDetail?.svcType;

  const permissionState =
    useSelector((state) => state.get('detail'))?.permission || {};
  const subscriptionPermission =
    permissionState?.subscriptionPermission || 'NON';

  // 구독 가능 여부 (전체 이용 가능 API 이거나 구독 권한이 있는 경우)
  const SubscriptionAvailability = useMemo(
    () =>
      subscriptionPermission !== 'NOTKEY' &&
      (serviceDetail?.authCd === 'NON' || subscriptionPermission === 'NOR'),
    [serviceDetail, subscriptionPermission],
  );

  const keyState = useSelector((state) => state.get('keySelect')) || {};
  const keyList = keyState?.keyList || [];
  const fetchKeySuccess = keyState?.fetchSuccess || false;
  const selectedKeyId = keyState?.selectedKeyId;
  const selectedKey = useMemo(
    () => keyList.find((key) => key.keyId === selectedKeyId) || keyList[0],
    [keyList, selectedKeyId],
  );

  const [openKeyPopup, setOpenKeyPopup] = useState(false); //키 팝업
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // API 목록 조회
  useEffect(() => {
    if (fetchKeySuccess)
      dispatch(fetchApiList({ svcId, keyId: selectedKey?.keyId }));
  }, [svcId, selectedKey, fetchKeySuccess]);

  // Redux State Update
  const handleUpdateListState = (field, updatedData) => {
    dispatch(updateListField({ field: `list.${field}`, value: updatedData }));
  };

  // Redux State Update
  const handleUpdateKeyState = (field, updatedData) => {
    dispatch(updateKeyField({ field: `${field}`, value: updatedData }));
  };

  //키 모달 버튼 클릭 시 핸들링
  const handleOpenKeyPopup = () => {
    setOpenKeyPopup(true);
  };

  // API Key 신청 버튼 클릭시 이동 핸들링
  const handleOpenKeyPage = () => {
    navigate(`${getRoutePath(basename, '/my/keys')}`);
  };

  // 키 모달 선택 완료 시 핸들링
  const handleSaveKey = (updatedData) => {
    localStorage.setItem('apiStoreKey', updatedData?.keyId);
    handleUpdateKeyState('selectedKeyId', updatedData?.keyId);
    setOpenKeyPopup(false);
  };

  // 체크박스 전체 체크 시 핸들링
  const handleCheckAll = (checked) => {
    if (checked) {
      const checkedList = [];
      for (const api of apiList) {
        const subStat = api?.subStat;
        if (subStat === 'N' || subStat === 'REJ' || subStat === 'CCL')
          checkedList.push(api.apiId);
      }
      handleUpdateListState('checkedList', checkedList);
    } else {
      handleUpdateListState('checkedList', []);
    }
  };

  // 단일 체크박스 체크 시 핸들링
  const handleCheck = (checked, id) => {
    if (checked) {
      const nextData = produce(checkedList, (draft) => {
        draft.push(id);
      });
      handleUpdateListState('checkedList', nextData);
    } else {
      const nextData = produce(checkedList, (draft) => {
        return draft.filter((data) => data !== id);
      });
      handleUpdateListState('checkedList', nextData);
    }
  };

  // 클립보드 복사 시 핸들링
  const handleCopyText = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    addToast(intlObj.get(message['store.copyToCilpboard']), 'success');
  };

  const tableColumns = [
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      width: 'auto',
      resize: true,
      showSorterTooltip: false,
      sorter: (a, b, order) => compareString(a?.path, b?.path, order),
      render: (text, record) => {
        return (
          <>
            <Division flex={true} gap={10} alignItems={'center'}>
              <Method method={record.method} />
              <Ellipsis>{text}</Ellipsis>
              <Buttons.IconCopy
                onClick={(e) => {
                  // TODO: staging DB 가 따로 없는 관계로 staging 인 경우 Gateway Domain 하드코딩, 추후 변경 예정
                  const environment = process.env.VITE_APP_ENV;
                  const server =
                    environment === 'staging'
                      ? `${getStgGatewayUrl(serviceType)}${getGatewayPrefix(serviceType, svcId)}`
                      : `${record?.gwDomain}${getGatewayPrefix(serviceType, svcId)}`;
                  e.stopPropagation();
                  handleCopyText(`${ensureProtocol(server)}${text}`);
                }}
              />
            </Division>
          </>
        );
      },
      onCell: () => ({
        style: {
          paddingLeft: 0,
        },
      }),
    },
    {
      title: intlObj.get(message['store.settingQos']),
      key: 'qos',
      ellipsis: true,
      align: 'center',
      width: '27%',
      resize: true,
      render: (text, record) => (
        <QosForm list={record?.qosList} readOnly={true} />
      ),
    },
    {
      title: SubscriptionAvailability ? (
        <Checkbox
          disabled={
            isSubscriptionApprovalPending || checkableApiList?.length === 0
          }
          checked={isCheckedAll}
          onChange={(e) => handleCheckAll(e.target.checked)}
        />
      ) : (
        '-'
      ),
      align: 'center',
      width: '10%',
      resize: true,
      render: (text, record) => {
        if (SubscriptionAvailability) {
          if (record.subStat === 'APR') {
            return intlObj.get(message['store.pendingApr']);
          } else if (record.subStat === 'NOR') {
            return intlObj.get(message['store.subscribing']);
          } else {
            return (
              <Checkbox
                disabled={isSubscriptionApprovalPending}
                checked={checkedList.includes(record.apiId)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleCheck(e.target.checked, record.apiId)}
              />
            );
          }
        } else {
          return '-';
        }
      },
    },
  ];

  const tableData = useMemo(
    () =>
      produce(apiList, (draft) => {
        draft.map((value, index) => {
          const api = apiList[index];
          const info = api?.info;
          const parameters = info?.parameters || [];
          const requestBody = info?.requestBody || {};
          const subscribeStatus = api?.subStat;
          const excutable =
            subscribeStatus === 'NOR' &&
            api?.gwDomain !== null &&
            serviceType !== undefined;

          // TODO: staging DB 가 따로 없는 관계로 staging 인 경우 Gateway Domain 하드코딩, 추후 변경 예정
          const environment = process.env.VITE_APP_ENV;
          const server =
            environment === 'staging'
              ? `${getStgGatewayUrl(serviceType)}${getGatewayPrefix(serviceType, svcId)}`
              : `${api?.gwDomain}${getGatewayPrefix(serviceType, svcId)}`;

          value.expandedArea = (
            <>
              <TestConsole
                server={ensureProtocol(server)}
                path={api?.path}
                method={api?.method}
                excutable={excutable}
                parameters={parameters}
                requestBody={requestBody}
                apiKey={selectedKey}
              />
            </>
          );
        });
      }),
    [apiList, serviceType, svcId, selectedKey],
  );

  return (
    <div ref={ref}>
      <ContentHeader
        spacing={20}
        $border={true}
        title={intlObj.get(message['store.apiList'])}
        extraContent={
          keyList?.length > 0 ? (
            <Selector onClick={handleOpenKeyPopup} icon={'key'} width={300}>
              {selectedKey?.keyName}
            </Selector>
          ) : (
            <ApplyKey onClick={handleOpenKeyPage} />
          )
        }
      />
      {serviceDetail?.gwDomain && (
        <Division flex={true} gap={20} alignItems={'center'} mb={20}>
          {/* TODO: staging DB 가 따로 없는 관계로 staging 인 경우 Gateway Domain 하드코딩, 추후 변경 예정 */}
          <Division.Title>API G/W Domain</Division.Title>
          <Division.SubTitle>
            {process.env.VITE_APP_ENV === 'staging'
              ? `${getStgGatewayUrl(serviceType)}${getGatewayPrefix(serviceType, svcId)}`
              : `${serviceDetail?.gwDomain}${getGatewayPrefix(serviceType, svcId)}`}
          </Division.SubTitle>
        </Division>
      )}
      <CollapseTable
        loading={!fetchKeySuccess || fetchApiListLoading}
        rowKey={(record) =>
          `${record.apiId}${selectedKey !== undefined ? `-${selectedKey.keyId}` : ''}`
        }
        columns={tableColumns}
        data={tableData}
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
      />
      <KeyModal
        open={openKeyPopup}
        onOk={(updatedData) => {
          handleSaveKey(updatedData);
        }}
        onCancel={() => setOpenKeyPopup(false)}
        value={selectedKey}
      />
    </div>
  );
});

export default ApiList;
