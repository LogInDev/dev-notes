import { memoize } from 'lodash';
import { query } from 'utils/commonUtils';
import { whereIsSite } from '@hcp-web-dwp/utils';

import { getGrafanaUrl } from 'utils/appsUtils';

export const buildGrafanaUrl = memoize(
  async ({
    prjCat,
    locId,
    prjId,
    target,
    env,
    rscId,
    siteId,
    svcType,
    isCqSite,
    isWxSite,
    isAiccSite,
  }) => {
    if (svcType === 'app') {
      const appGrafanaUrl = await getGrafanaUrl({
        prjCat,
        locId,
        prjId,
        target,
        env,
        rscId,
        siteId,
      });

      return appGrafanaUrl;
    }

    const defaultGrafanaUrl =
      'https://grafana.skhynix.com/d/nFST3XPMk/50-resource-service';

    return buildSiteGrafanaUrl(svcType, siteId, defaultGrafanaUrl, {
      locId,
      prjId,
      rscId,
      env,
      isCqSite,
      isWxSite,
      isAiccSite,
    });
  },
);

export const getSiteGrafanaUrl = (
  svcType,
  siteId,
  grfanaDefaultUrl,
  locId,
  isCqSite,
  isWxSite,
  isAiccSite,
) => {
  const trimSvcType = svcType.trim();
  const cqGrafanaUrl =
    'http://grafana.cqhcpp01.skhynix-cq.com.cn/d/QpFay9Qnk/50-resource-service';
  const wsGrafanaUrl =
    'http://grafana.wxhcpp01.skhynix.com.cn/grafana/d/1FlwrimVk/50-resource-service';
  const aicGrafanaUrl =
    'http://grafana.aicc01.skhynix.com/d/nFST3XPMk/50-resource-service';
  const grafanaUrlGls =
    'http://grafana-gausslabs.skhynix.com/grafana/d/nFST3XPMk/50-resource-service';

  if (trimSvcType === 'job' || trimSvcType.startsWith('mlflow')) {
    const siteStr = whereIsSite(siteId);

    if (trimSvcType.startsWith('mlflow') && locId === 'hy-koic-icp-gls-p01') {
      return grafanaUrlGls;
    }
    if (siteStr.indexOf('-cq') > -1) {
      return cqGrafanaUrl;
    }
    if (siteStr.indexOf('-wx') > -1) {
      return wsGrafanaUrl;
    }
    if (siteStr.indexOf('-aic') > -1 && !trimSvcType.startsWith('mlflow')) {
      return aicGrafanaUrl;
    }
  }

  if (trimSvcType.startsWith('helm')) {
    if (isCqSite) {
      return cqGrafanaUrl;
    }
    if (isWxSite) {
      return wsGrafanaUrl;
    }
    if (isAiccSite) {
      return aicGrafanaUrl;
    }
  }

  return grfanaDefaultUrl;
};

export const buildSiteGrafanaUrl = (
  svcType,
  siteId,
  grfanaDefaultUrl,
  { locId, prjId, rscId, env, isCqSite, isWxSite, isAiccSite },
) => {
  const baseUrl = getSiteGrafanaUrl(
    svcType,
    siteId,
    grfanaDefaultUrl,
    locId,
    isCqSite,
    isWxSite,
    isAiccSite,
  );
  const baseParams = {
    orgId: 1,
    'var-Clusters': locId,
    'var-label_prjId': prjId,
    'var-label_rscId': rscId,
  };

  if (env) {
    baseParams['var-label_env'] = env.toLowerCase();
  }

  return `${baseUrl}?${query(baseParams)}`;
};
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { AutoSizer } from 'react-virtualized';
import moment from 'moment';
import {
  useProfile,
  useIsCqSite,
  useIsWxSite,
  useIsAiccSite,
} from '@hcp-web-dwp/utils';
import { getUniqueKey } from 'utils/Str';
import downloadTableToExcel from 'utils/downloadUtils';
import { buildGrafanaUrl } from 'utils/grafanaUrlBuilder';
import { toFixedIfDecimal } from 'utils/commonUtils';
import { Buttons, Icons, Table } from '@hcp-web-dwp/ui';
import Division from 'components/Atoms/Division';

// 자원 사용률 구간별 비율 column 에 대한 config
const usageByRangeConfig = [
  { key: 'usage_0_to_10', label: '0 ~ 10' },
  { key: 'usage_10_to_20', label: '10 ~ 20' },
  { key: 'usage_20_to_30', label: '20 ~ 30' },
  { key: 'usage_30_to_40', label: '30 ~ 40' },
  { key: 'usage_40_to_50', label: '40 ~ 50' },
  { key: 'usage_50_to_60', label: '50 ~ 60' },
  { key: 'usage_60_to_70', label: '60 ~ 70' },
  { key: 'usage_70_to_80', label: '70 ~ 80' },
  { key: 'usage_80_to_90', label: '80 ~ 90' },
  { key: 'usage_90_to_100', label: '90 ~ 100' },
];

const DistributionTable = () => {
  const profile = useProfile();

  const mainState =
    useSelector((state) => state.get(getUniqueKey('main'))) || {};
  const resourceList = mainState?.resourceList || []; // 자원 목록

  // 자원 트렌드 관련 상태
  const resourceTrendState = mainState?.resourceTrend || {};
  const resource = resourceTrendState?.resource || 'gpu';

  // 자원 사용률 구간 별 hcp resource 분포 관련 상태
  const distributionState = mainState?.hcpResourceDistribution || {};
  const hcpResourceList = distributionState?.data || []; // hcp resource 목록

  // 자원 사용률 구간 별 hcp resource 분포 > 차트 관련 상태
  const chartData = distributionState?.chart?.data || [];
  const oneDepthData = chartData[0];
  const twoDepthData = chartData[1];
  const chartRange = distributionState?.chart?.range || [];

  // 자원 사용률 구간 별 hcp resource 분포 > 테이블 관련 상태
  const tableDepth = distributionState?.table?.depth || 0;

  const isCqSite = useIsCqSite();
  const isWxSite = useIsWxSite();
  const isAiccSite = useIsAiccSite();

  // Excel 파일 다운로드 핸들링
  const handleDownloadToExcel = () => {
    // grafana column 은 제외하고 다운로드
    const filteredColumns = tableColumns.filter((col) => col.key !== 'grafana');
    const resourceName =
      resourceList?.find((item) => item?.key === resource)?.title || '자원';
    downloadTableToExcel(
      filteredColumns,
      tableData,
      `${resourceName}_사용률_구간_별_resource_분포_${moment().format(
        'YYYYMMDD',
      )}`,
    );
  };

  // Grafana 페이지 이동 핸들링
  const handleOpenGrafana = useCallback(
    async (record) => {
      if (!record || typeof record !== 'object') return;

      const {
        prjCat,
        locId,
        project: prjId,
        target,
        env,
        rscId,
        svcType,
      } = record;

      const siteId = profile?.SITE_ID;

      const grafanaUrl = await buildGrafanaUrl({
        prjCat,
        locId,
        prjId,
        target,
        env,
        rscId,
        siteId,
        svcType,
        isCqSite,
        isWxSite,
        isAiccSite,
      });
      window.open(grafanaUrl, '_BLANK');
    },
    [profile],
  );

  // Grafana 버튼 렌더링
  const renderGrafana = useCallback(
    (record) => {
      if (!record || typeof record !== 'object') return null;

      const { locId, runStatus, svcType } = record;

      if ([null, 'null', '-'].includes(locId)) return null;
      const trimSvcType = svcType.trim();

      const isMonitorable =
        trimSvcType === 'app' ||
        trimSvcType === 'job' ||
        trimSvcType.startsWith('helm') ||
        trimSvcType.startsWith('mlflow');

      const isRunning = runStatus === 'RUNNING';
      const isDisabled = !isMonitorable || !isRunning;

      return (
        <GrafanaIcon
          disabled={isDisabled}
          onClick={(e) => {
            if (!isDisabled) handleOpenGrafana(record);
          }}
        />
      );
    },
    [handleOpenGrafana],
  );

  const tableData = useMemo(() => {
    const data =
      tableDepth === 0
        ? hcpResourceList
        : tableDepth === 1
        ? oneDepthData?.[chartRange?.[tableDepth - 1]]?.list
        : tableDepth === 2
        ? twoDepthData?.[chartRange?.[tableDepth - 1]]?.list
        : undefined;

    // String 으로 변환해줘야 sorting 이 정상적으로 동작함
    return data?.map((item) => {
      const {
        limit,
        usage,
        perRequest,
        perAvgUsage,
        usage_0_to_5,
        usage_5_to_10,
        usage_10_to_15,
        usage_15_to_20,
        usage_20_to_25,
        usage_25_to_30,
        usage_30_to_35,
        usage_35_to_40,
        usage_40_to_45,
        usage_45_to_50,
        usage_50_to_55,
        usage_55_to_60,
        usage_60_to_65,
        usage_65_to_70,
        usage_70_to_75,
        usage_75_to_80,
        usage_80_to_85,
        usage_85_to_90,
        usage_90_to_95,
        usage_95_to_100,
      } = item?.[resource] || {};

      return {
        runStatus: item?.runStatus,
        prjCat: item?.prjCat,
        locId: item?.locId,
        target: item?.target,
        env: item?.env,
        rscId: item?.rscId,
        project: item?.project,
        svcType: item?.svcType,
        limit: toFixedIfDecimal(limit, undefined, true),
        usage: toFixedIfDecimal(usage, undefined, true),
        perRequest: toFixedIfDecimal(perRequest, undefined, true),
        perAvgUsage: toFixedIfDecimal(perAvgUsage, undefined, true),
        usage_0_to_10: toFixedIfDecimal(
          usage_0_to_5 + usage_5_to_10,
          undefined,
          true,
        ),
        usage_10_to_20: toFixedIfDecimal(
          usage_10_to_15 + usage_15_to_20,
          undefined,
          true,
        ),
        usage_20_to_30: toFixedIfDecimal(
          usage_20_to_25 + usage_25_to_30,
          undefined,
          true,
        ),
        usage_30_to_40: toFixedIfDecimal(
          usage_30_to_35 + usage_35_to_40,
          undefined,
          true,
        ),
        usage_40_to_50: toFixedIfDecimal(
          usage_40_to_45 + usage_45_to_50,
          undefined,
          true,
        ),
        usage_50_to_60: toFixedIfDecimal(
          usage_50_to_55 + usage_55_to_60,
          undefined,
          true,
        ),
        usage_60_to_70: toFixedIfDecimal(
          usage_60_to_65 + usage_65_to_70,
          undefined,
          true,
        ),
        usage_70_to_80: toFixedIfDecimal(
          usage_70_to_75 + usage_75_to_80,
          undefined,
          true,
        ),
        usage_80_to_90: toFixedIfDecimal(
          usage_80_to_85 + usage_85_to_90,
          undefined,
          true,
        ),
        usage_90_to_100: toFixedIfDecimal(
          usage_90_to_95 + usage_95_to_100,
          undefined,
          true,
        ),
      };
    });
  }, [
    resource,
    hcpResourceList,
    chartRange,
    oneDepthData,
    twoDepthData,
    tableDepth,
  ]);

  const tableColumns = useMemo(
    () => [
      {
        title: 'Resource',
        key: 'rscId',
        dataIndex: 'rscId',
        width: 'auto',
        sortable: true,
        ellipsis: true,
        render: (_, record) =>
          `${record?.rscId}-${record?.target}-${record?.env}`,
      },
      {
        title: 'Project',
        key: 'project',
        dataIndex: 'project',
        width: '200px',
        sortable: true,
        ellipsis: true,
      },
      {
        title: '자원 할당량',
        key: 'limit',
        dataIndex: 'limit',
        width: '100px',
        sortable: true,
        ellipsis: true,
      },
      {
        title: '사용량',
        key: 'usage',
        dataIndex: 'usage',
        width: '100px',
        sortable: true,
        ellipsis: true,
      },
      {
        title: '요청률 (%)',
        key: 'perRequest',
        dataIndex: 'perRequest',
        width: '100px',
        sortable: true,
        ellipsis: true,
      },
      {
        title: '평균 사용률 (%)',
        key: 'perAvgUsage',
        dataIndex: 'perAvgUsage',
        width: '120px',
        sortable: true,
        ellipsis: true,
      },
      {
        title: 'Grafana',
        key: 'grafana',
        width: '80px',
        align: 'center',
        className: 'center',
        render: (text, record) => renderGrafana(record),
      },
      {
        title: '자원 사용률 구간별 비율 (%)',
        key: 'usageByRange',
        children: usageByRangeConfig.map((config) => ({
          title: config.label,
          key: config.key,
          dataIndex: config.key,
          width: '80px',
          sortable: true,
          ellipsis: true,
          className: 'tdType02',
        })),
      },
    ],
    [renderGrafana],
  );

  return (
    <>
      <Division flex={true} justifyContent={'flex-end'}>
        <Buttons.SaveButton
          className="type-panel"
          onClick={handleDownloadToExcel}
        >
          Excel 다운로드
        </Buttons.SaveButton>
      </Division>
      <div style={{ height: 500 }}>
        <AutoSizer>
          {({ width, height }) => (
            <Table
              rowKey={(record) =>
                `${record?.rscId}-${record?.target}-${record?.env}`
              }
              style={{ minWidth: 1600 }}
              width={width}
              height={height}
              columns={tableColumns}
              dataSource={tableData}
              resizable={true}
              virtualize={true}
              pageSize={10}
            />
          )}
        </AutoSizer>
      </div>
    </>
  );
};

export default DistributionTable;

const GrafanaIcon = styled(Icons.IconDetailManageGroup)`
  cursor: pointer;
  &[disabled] {
    cursor: auto;
  }
`;
