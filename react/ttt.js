import { memoize } from 'lodash';
import { query } from 'utils/commonUtils';
import { whereIsSite } from '@hcp-web-dwp/utils';
import { getGrafanaUrl } from 'utils/appsUtils';

const DEFAULT_GRAFANA_URL =
  'https://grafana.skhynix.com/d/nFST3XPMk/50-resource-service';

const URLS = {
  cq: 'http://grafana.cqhcpp01.skhynix-cq.com.cn/d/QpFay9Qnk/50-resource-service',
  wx: 'http://grafana.wxhcpp01.skhynix.com.cn/grafana/d/1FlwrimVk/50-resource-service',
  aicc: 'http://grafana.aicc01.skhynix.com/d/nFST3XPMk/50-resource-service',
  gls: 'http://grafana-gausslabs.skhynix.com/grafana/d/nFST3XPMk/50-resource-service',
};

const normalizeSvcType = (svcType) => (svcType ?? '').trim();

const isMonitorableSvcType = (svcType) =>
  svcType === 'app' ||
  svcType === 'job' ||
  svcType.startsWith('helm') ||
  svcType.startsWith('mlflow');

const buildQueryUrl = ({ baseUrl, locId, prjId, rscId, env }) => {
  const params = {
    orgId: 1,
    'var-Clusters': locId,
    'var-label_prjId': prjId,
    'var-label_rscId': rscId,
  };

  if (env) params['var-label_env'] = String(env).toLowerCase();

  return `${baseUrl}?${query(params)}`;
};

const resolveBaseUrl = ({ svcType, siteId, locId, siteFlags, defaultUrl }) => {
  // job / mlflow: whereIsSite(siteId) 기반 + mlflow gls 특수케이스
  if (svcType === 'job' || svcType.startsWith('mlflow')) {
    const siteStr = whereIsSite(siteId);

    if (svcType.startsWith('mlflow') && locId === 'hy-koic-icp-gls-p01') {
      return URLS.gls;
    }
    if (siteStr?.includes?.('-cq')) return URLS.cq;
    if (siteStr?.includes?.('-wx')) return URLS.wx;
    if (siteStr?.includes?.('-aic') && !svcType.startsWith('mlflow')) {
      return URLS.aicc;
    }
    return defaultUrl;
  }

  // helm: boolean flags 기반
  if (svcType.startsWith('helm')) {
    if (siteFlags?.isCqSite) return URLS.cq;
    if (siteFlags?.isWxSite) return URLS.wx;
    if (siteFlags?.isAiccSite) return URLS.aicc;
    return defaultUrl;
  }

  return defaultUrl;
};

/**
 * 실무 추천 형태:
 * - site 판별 로직은 컴포넌트(또는 상위)에서 @hcp-web-dwp/utils 결과로만 만든다.
 * - buildGrafanaUrl은 "url 생성"만 책임지고, site 판별 규칙 자체는 갖지 않는다.
 */
export const buildGrafanaUrl = memoize(async (args) => {
  const {
    prjCat,
    locId,
    prjId,
    target,
    env,
    rscId,
    siteId,
    svcType: rawSvcType,
    siteFlags,
  } = args || {};

  const svcType = normalizeSvcType(rawSvcType);

  // svcType이 비정상/모니터링 불가면 기본 URL (안전)
  if (!svcType || !isMonitorableSvcType(svcType)) {
    return DEFAULT_GRAFANA_URL;
  }

  // app은 기존 로직(앱 전용 URL 생성)을 그대로 사용
  if (svcType === 'app') {
    return getGrafanaUrl({
      prjCat,
      locId,
      prjId,
      target,
      env,
      rscId,
      siteId,
    });
  }

  const baseUrl = resolveBaseUrl({
    svcType,
    siteId,
    locId,
    siteFlags,
    defaultUrl: DEFAULT_GRAFANA_URL,
  });

  return buildQueryUrl({
    baseUrl,
    locId,
    prjId,
    rscId,
    env,
  });
});
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

// 자원 사용률 구간별 비율 column config
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

const isValidLocId = (locId) => ![null, 'null', '-'].includes(locId);

const normalizeSvcType = (svcType) => (svcType ?? '').trim();

const isMonitorable = (svcType) => {
  const t = normalizeSvcType(svcType);
  return (
    t === 'app' ||
    t === 'job' ||
    t.startsWith('helm') ||
    t.startsWith('mlflow')
  );
};

const DistributionTable = () => {
  const profile = useProfile();
  const siteId = profile?.SITE_ID;

  const isCqSite = useIsCqSite();
  const isWxSite = useIsWxSite();
  const isAiccSite = useIsAiccSite();

  // site 판별 결과는 한 덩어리로 묶어서 하위 로직에 전달 (deps 단순화)
  const siteFlags = useMemo(
    () => ({ isCqSite, isWxSite, isAiccSite }),
    [isCqSite, isWxSite, isAiccSite],
  );

  const mainState =
    useSelector((state) => state.get(getUniqueKey('main'))) || {};

  const resourceList = mainState?.resourceList || [];

  const resourceTrendState = mainState?.resourceTrend || {};
  const resource = resourceTrendState?.resource || 'gpu';

  const distributionState = mainState?.hcpResourceDistribution || {};
  const hcpResourceList = distributionState?.data || [];

  const chartData = distributionState?.chart?.data || [];
  const oneDepthData = chartData[0];
  const twoDepthData = chartData[1];
  const chartRange = distributionState?.chart?.range || [];

  const tableDepth = distributionState?.table?.depth || 0;

  const tableData = useMemo(() => {
    const data =
      tableDepth === 0
        ? hcpResourceList
        : tableDepth === 1
          ? oneDepthData?.[chartRange?.[tableDepth - 1]]?.list
          : tableDepth === 2
            ? twoDepthData?.[chartRange?.[tableDepth - 1]]?.list
            : undefined;

    return data?.map((item) => {
      const metric = item?.[resource] || {};
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
      } = metric;

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
          (usage_0_to_5 ?? 0) + (usage_5_to_10 ?? 0),
          undefined,
          true,
        ),
        usage_10_to_20: toFixedIfDecimal(
          (usage_10_to_15 ?? 0) + (usage_15_to_20 ?? 0),
          undefined,
          true,
        ),
        usage_20_to_30: toFixedIfDecimal(
          (usage_20_to_25 ?? 0) + (usage_25_to_30 ?? 0),
          undefined,
          true,
        ),
        usage_30_to_40: toFixedIfDecimal(
          (usage_30_to_35 ?? 0) + (usage_35_to_40 ?? 0),
          undefined,
          true,
        ),
        usage_40_to_50: toFixedIfDecimal(
          (usage_40_to_45 ?? 0) + (usage_45_to_50 ?? 0),
          undefined,
          true,
        ),
        usage_50_to_60: toFixedIfDecimal(
          (usage_50_to_55 ?? 0) + (usage_55_to_60 ?? 0),
          undefined,
          true,
        ),
        usage_60_to_70: toFixedIfDecimal(
          (usage_60_to_65 ?? 0) + (usage_65_to_70 ?? 0),
          undefined,
          true,
        ),
        usage_70_to_80: toFixedIfDecimal(
          (usage_70_to_75 ?? 0) + (usage_75_to_80 ?? 0),
          undefined,
          true,
        ),
        usage_80_to_90: toFixedIfDecimal(
          (usage_80_to_85 ?? 0) + (usage_85_to_90 ?? 0),
          undefined,
          true,
        ),
        usage_90_to_100: toFixedIfDecimal(
          (usage_90_to_95 ?? 0) + (usage_95_to_100 ?? 0),
          undefined,
          true,
        ),
      };
    });
  }, [resource, hcpResourceList, chartRange, oneDepthData, twoDepthData, tableDepth]);

  const handleOpenGrafana = useCallback(
    async (record) => {
      if (!record || typeof record !== 'object') return;

      const { prjCat, locId, project: prjId, target, env, rscId, svcType } =
        record;

      const grafanaUrl = await buildGrafanaUrl({
        prjCat,
        locId,
        prjId,
        target,
        env,
        rscId,
        siteId,
        svcType,
        siteFlags,
      });

      window.open(grafanaUrl, '_BLANK');
    },
    // ✅ siteId / siteFlags가 바뀌면 콜백도 반드시 새로 만들어져야 안전함
    [siteId, siteFlags],
  );

  const renderGrafana = useCallback(
    (record) => {
      if (!record || typeof record !== 'object') return null;

      const { locId, runStatus, svcType } = record;

      if (!isValidLocId(locId)) return null;

      const svc = normalizeSvcType(svcType);
      const monitorable = isMonitorable(svc);
      const running = runStatus === 'RUNNING';

      const disabled = !monitorable || !running;

      return (
        <GrafanaIcon
          disabled={disabled}
          onClick={() => {
            if (!disabled) handleOpenGrafana(record);
          }}
        />
      );
    },
    [handleOpenGrafana],
  );

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
          `${record?.rscId ?? ''}-${record?.target ?? ''}-${record?.env ?? ''}`,
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
        render: (_, record) => renderGrafana(record),
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

  const handleDownloadToExcel = useCallback(() => {
    const filteredColumns = tableColumns.filter((col) => col.key !== 'grafana');
    const resourceName =
      resourceList?.find((item) => item?.key === resource)?.title || '자원';

    downloadTableToExcel(
      filteredColumns,
      tableData,
      `${resourceName}_사용률_구간_별_resource_분포_${moment().format('YYYYMMDD')}`,
    );
  }, [tableColumns, tableData, resourceList, resource]);

  return (
    <>
      <Division flex={true} justifyContent={'flex-end'}>
        <Buttons.SaveButton className="type-panel" onClick={handleDownloadToExcel}>
          Excel 다운로드
        </Buttons.SaveButton>
      </Division>

      <div style={{ height: 500 }}>
        <AutoSizer>
          {({ width, height }) => (
            <Table
              rowKey={(record) =>
                `${record?.rscId ?? ''}-${record?.target ?? ''}-${record?.env ?? ''}`
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
