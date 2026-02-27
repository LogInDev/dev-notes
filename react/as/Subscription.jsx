import { forwardRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Spin } from 'signlw';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import ContentHeader from '@/components/Organisms/ContentHeader';
import List from '@/components/Organisms/List';
import NoData from '@/components/Atoms/NoData';

const Subscription = forwardRef((_, ref) => {
  const keyState = useSelector((state) => state.get('keySelect')) || {};
  const keyList = keyState?.keyList || [];
  const selectedKeyId = keyState?.selectedKeyId;
  const selectedKey = useMemo(
    () => keyList.find((key) => key.keyId === selectedKeyId),
    [keyList, selectedKeyId],
  );

  const detailState = useSelector((state) => state.get('detail'))?.detail || {};
  const serviceDetail = detailState?.serviceDetail || {};
  const fetchServiceDetailLoading =
    detailState?.fetchServiceDetailLoading || false;

  const permissionState =
    useSelector((state) => state.get('detail'))?.permission || {};
  const subscriptionPermission =
    permissionState?.subscriptionPermission || 'NON';
  const fetchPermissionLoading =
    permissionState?.fetchPermissionLoading || false;

  const tableColumns = [
    {
      title: intlObj.get(message['store.keyName']),
      dataIndex: 'keyName',
    },
    {
      title: intlObj.get(message['store.project']),
      dataIndex: 'prjId',
    },
    {
      title: intlObj.get(message['store.keyType']),
      dataIndex: 'authCd',
      align: 'center',
      render: (text) =>
        text === 'PSN'
          ? intlObj.get(message['store.personal'])
          : text === 'SYS'
            ? intlObj.get(message['store.system'])
            : '-',
    },
  ];

  return (
    <div ref={ref}>
      <ContentHeader
        $border={true}
        title={intlObj.get(message['store.subInfo'])}
        spacing={20}
      />
      <Spin spinning={fetchServiceDetailLoading || fetchPermissionLoading}>
        {subscriptionPermission === 'NOTKEY' ? (
          <NoData.Forbid
            title={intlObj.get(message['store.noKey'])}
            desc={intlObj.get(message['store.pleaseAddKey'])}
            height={300}
          />
        ) : serviceDetail?.authCd === 'NON' ? (
          <NoData.Allow
            title={intlObj.get(message['store.isPublicApi'])}
            height={300}
          />
        ) : subscriptionPermission === 'NOR' ? (
          <List
            rowKey={'keyId'}
            columns={tableColumns}
            dataSource={[selectedKey]}
            pagination={false}
          />
        ) : (
          <NoData.Forbid
            title={intlObj.get(message['store.noSubPermission'])}
            desc={intlObj.get(message['store.pleaseRequestPermission'])}
            height={300}
          />
        )}
      </Spin>
    </div>
  );
});

export default Subscription;
