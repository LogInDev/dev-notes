import { memoize } from 'lodash';
import Axios from 'axios';
import { whereIsSite } from '@hcp-web-dwp/utils';
import { query } from 'utils/commonUtils';

/**
 * =========================================================
 * Constants
 * =========================================================
 */

const dcosLocIds = ['hy-koic-mss-app-p01', 'hy-koic-mss-app-p02'];

const gpuGrafanaLocIds = [
  'hy-koic-icp-gls-p01',
  'hy-koic-icp-day-p01',
  'hy-koic-icp-aic-p02',
  'hy-koic-icp-day-p10-alert',
  'hy-koic-k8s-gls-p01',
  'hy-koic-k8s-day-p01',
  'hy-koic-k8s-day-p02',
];

const DEFAULT_GRAFANA_URL =
  'http://grafana.skhynix.com/d/nFST3XPMk/50-resource-service';

const URLS = {
  cq: 'http://grafana.cqhcpp01.skhynix-cq.com.cn/d/QpFay9Qnk/50-resource-service',
  wx: 'http://grafana.wxhcpp01.skhynix.com.cn/grafana/d/1FlwrimVk/50-resource-service',

  // AICC는 대시보드가 app/job로 나뉘는 요구사항 반영
  appAicc: 'http://grafana.aicc01.skhynix.com/d/XYddMeTMz/50-resource-service',
  jobAicc: 'http://grafana.aicc01.skhynix.com/d/nFST3XPMk/50-resource-service',

  // helm에서 쓸 기본 aicc (실제로 jobAicc가 50-resource-service라면 이걸로 통일)
  aicc: 'http://grafana.aicc01.skhynix.com/d/nFST3XPMk/50-resource-service',
};

/**
 * =========================================================
 * Utils
 * =========================================================
 */

const trimSvcType = (svcType) => (svcType ?? '').trim();

const isMonitorableSvcType = (svcType) =>
  svcType === 'app' ||
  svcType === 'job' ||
  svcType === 'mlflow-model' ||
  svcType.startsWith('helm');

const buildQueryUrl = ({ baseUrl, locId, prjId, rscId, env, extraParams }) => {
  const params = {
    orgId: 1,
    'var-Clusters': locId,
    'var-label_prjId': prjId,
    'var-label_rscId': rscId,
    ...(extraParams || {}),
  };

  if (env) {
    params['var-label_env'] = String(env).toLowerCase();
  }

  return `${baseUrl}?${query(params)}`;
};

/**
 * svcType + site 정보로 baseUrl을 결정 (job/helm/mlflow-model 공통)
 */
const resolveBaseUrl = ({ svcType, siteId, siteFlags, defaultUrl }) => {
  // app/job/mlflow-model은 siteId 기반(whereIsSite)으로 분기
  if (svcType === 'app' || svcType === 'job' || svcType === 'mlflow-model') {
    const siteStr = whereIsSite(siteId);

    if (siteStr?.includes?.('-cq')) return URLS.cq;
    if (siteStr?.includes?.('-wx')) return URLS.wx;

    // -aic 인 경우 app/job 대시보드 분리
    if (siteStr?.includes?.('-aic')) {
      if (svcType === 'app') return URLS.appAicc;
      if (svcType === 'job' || svcType === 'mlflow-model') return URLS.jobAicc;
    }

    return defaultUrl;
  }

  // helm은 기존 boolean flag 기반 유지
  if (svcType.startsWith('helm')) {
    if (siteFlags?.isCqSite) return URLS.cq;
    if (siteFlags?.isWxSite) return URLS.wx;
    if (siteFlags?.isAiccSite) return URLS.aicc;
    return defaultUrl;
  }

  return defaultUrl;
};

/**
 * =========================================================
 * App URL Builder (기존 appsUtils.getGrafanaUrl 역할)
 * - "app" svcType 전용 + 특수 로직(gpuGrafanaLocIds, dcosLocIds 포함)
 * =========================================================
 */
const buildAppGrafanaUrl = memoize(
  async ({ prjCat, locId, prjId, target, env, rscId, siteId }) => {
    // 1) GPU Grafana 여부 체크 후 GPU 대시보드로 보내는 로직
    if (gpuGrafanaLocIds.includes(locId)) {
      const res = await Axios.get(
        `${process.env.REACT_APP_DEV_OPS_APP_URL}/apps/${rscId}/resources`,
      );
      if (res.status !== 200) throw res;

      const lowerEnv = String(env).toLowerCase();

      const gpuGrafana = res.data.response
        ?.filter(({ config }) => config === target)
        ?.map(({ resources }) => resources)
        ?.some((item) => item?.[lowerEnv]?.gpuEnabled === true);

      if (gpuGrafana) {
        return `http://grafana.skhynix.com/d/nFST3XPMk/50-resource-service?${query(
          {
            orgId: 1,
            'var-Clusters': locId,
            'var-label_prjId': prjId,
            'var-label_rscId': rscId,
            'var-label_target': target,
            'var-label_env': lowerEnv,
            'var-CPU_Avg_Interval': '1m',
          },
        )}`;
      }
    }

    // 2) DCOS locId 인 경우 프로젝트 기본값(prjCat) 조회 필요
    if (dcosLocIds.includes(locId)) {
      let resolvedPrjCat = prjCat;

      if (!resolvedPrjCat) {
        const res = await Axios.get(
          `${process.env.REACT_APP_BASE_URL}/projects/${prjId}/defaults`,
        );
        if (res.status !== 200) throw res;

        const { response: project } = res.data;
        resolvedPrjCat = project?.prjCat?.toLowerCase();
      }

      const lowerEnv = String(env).toLowerCase();
      const lowerPrjCat = String(resolvedPrjCat).toLowerCase();

      return `http://grafana.skhynix.com/d/DvoAcni7z/40-resource-service?${query(
        {
          orgId: 1,
          'var-CLUSTER': locId,
          'var-TARGET': target,
          'var-ENV': lowerEnv,
          'var-PROJECT': prjId,
          'var-SERVICE': `/${lowerPrjCat}/${prjId}/${lowerEnv}/${rscId}`,
        },
      )}`;
    }

    // 3) 기본: site 기반 baseUrl 선택 후 파라미터 붙이기
    const baseUrl = resolveBaseUrl({
      svcType: 'app',
      siteId,
      siteFlags: null, // app은 whereIsSite 기반이므로 flag 불필요
      defaultUrl: 'http://grafana.skhynix.com/d/XYddMeTMz/50-resource-service',
    });

    return `${baseUrl}?${query({
      orgId: 1,
      'var-Clusters': locId,
      'var-label_prjId': prjId,
      'var-label_target': target,
      'var-label_env': String(env).toLowerCase(),
      'var-label_rscId': rscId,
    })}`;
  },
);

/**
 * =========================================================
 * Public API
 * - 기존 grafanaUrlBuilder.buildGrafanaUrl 역할
 * =========================================================
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

  const svcType = trimSvcType(rawSvcType);

  // 모니터링 대상이 아니면 기본 URL
  if (!svcType || !isMonitorableSvcType(svcType)) {
    return DEFAULT_GRAFANA_URL;
  }

  // app은 app 전용 로직(기존 appsUtils 통째로 흡수)
  if (svcType === 'app') {
    return buildAppGrafanaUrl({
      prjCat,
      locId,
      prjId,
      target,
      env,
      rscId,
      siteId,
    });
  }

  // job / mlflow-model / helm
  const baseUrl = resolveBaseUrl({
    svcType,
    siteId,
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

/**
 * (선택) 기존 호출부가 getGrafanaUrl을 직접 쓰는 곳이 있다면,
 * 깨지지 않게 named export로 호환 제공 가능
 */
export const getGrafanaUrl = buildAppGrafanaUrl;