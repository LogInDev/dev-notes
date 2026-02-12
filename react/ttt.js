grafanaUrlBuilder.js랑 appsUtil.js랑 수석님이 합치래... 어떻게 합치는게 좋을까?

  import { memoize } from 'lodash';
import { whereIsSite } from '@hcp-web-dwp/utils';

import { query } from 'utils/commonUtils';
import { getGrafanaUrl } from 'utils/appsUtils';

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
  appAicc: 'http://grafana.aicc01.skhynix.com/d/XYddMeTMz/50-resource-service',
  jobAicc: 'http://grafana.aicc01.skhynix.com/d/nFST3XPMk/50-resource-service',
};
const trimSvcType = (svcType) => (svcType ?? '').trim();

const isMonitorableSvcType = (svcType) =>
  svcType === 'app' ||
  svcType === 'job' ||
  svcType === 'mlflow-model' ||
  svcType.startsWith('helm');

const buildQueryUrl = ({ baseUrl, locId, prjId, rscId, env }) => {
  const params = {
    orgId: 1,
    'var-Clusters': locId,
    'var-label_prjId': prjId,
    'var-label_rscId': rscId,
  };

  if (env) {
    params['var-label_env'] = String(env).toLowerCase();
  }

  return `${baseUrl}?${query(params)}`;
};

const resolveBaseUrl = ({ svcType, siteId, siteFlags, defaultUrl }) => {
  if (svcType === 'app' || svcType === 'job' || svcType === 'mlflow-model') {
    const siteStr = whereIsSite(siteId);

    if (siteStr?.indexOf('-cq') > -1) {
      return URLS.cq;
    }
    if (siteStr?.indexOf('-wx') > -1) {
      return URLS.wx;
    }
    if (siteStr?.indexOf('-aic') > -1) {
      if(svcType === 'app'){
        return URLS.appAicc;
      }
      if(svcType === 'job'){
        return URLS.jobAicc;
      }
    }
    return defaultUrl;
  }

  if (svcType.startsWith('helm')) {
    if (siteFlags?.isCqSite) {
      return URLS.cq;
    }
    if (siteFlags?.isWxSite) {
      return URLS.wx;
    }
    if (siteFlags?.isAiccSite) {
      return URLS.aicc;
    }
  }

  return defaultUrl;
};

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

  const trimmedSvcType = trimSvcType(rawSvcType);

  if (!trimmedSvcType || !isMonitorableSvcType(trimmedSvcType)) {
    return DEFAULT_GRAFANA_URL;
  }

  if (trimmedSvcType === 'app') {
    return await getGrafanaUrl({
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
    trimmedSvcType,
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


import { memoize } from 'lodash';
import Axios from 'axios';
import { query } from 'utils/commonUtils';
import { whereIsSite } from '@hcp-web-dwp/utils';

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

// Grafana Url 생성
const getGrafanaUrl = memoize(
  async ({ prjCat, locId, prjId, target, env, rscId, siteId }) => {
    if (gpuGrafanaLocIds.includes(locId)) {
      const res = await Axios.get(
        `${process.env.REACT_APP_DEV_OPS_APP_URL}/apps/${rscId}/resources`,
      );
      if (res.status !== 200) throw res;

      const gpuGrafana = res.data.response
        ?.filter(({ config }) => config === target)
        ?.map(({ resources }) => resources)
        ?.some((item) => item[env.toLowerCase()].gpuEnabled === true);

      if (gpuGrafana)
        return `http://grafana.skhynix.com/d/nFST3XPMk/50-resource-service?${query(
          {
            orgId: 1,
            'var-Clusters': locId,
            'var-label_prjId': prjId,
            'var-label_rscId': rscId,
            'var-label_target': target,
            'var-label_env': env.toLowerCase(),
            'var-CPU_Avg_Interval': '1m',
          },
        )}
      `;
    }
    if (dcosLocIds.includes(locId)) {
      if (!prjCat) {
        const res = await Axios.get(
          `${process.env.REACT_APP_BASE_URL}/projects/${prjId}/defaults`,
        );
        if (res.status !== 200) throw res;

        const { response: project } = res.data;
        prjCat = project.prjCat.toLowerCase();
      }

      let url = '';
      url = `http://grafana.skhynix.com/d/DvoAcni7z/40-resource-service?${query(
        {
          orgId: 1,
          'var-CLUSTER': locId,
          'var-TARGET': target,
          'var-ENV': env.toLowerCase(),
          'var-PROJECT': prjId,
          'var-SERVICE': `/${prjCat.toLowerCase()}/${prjId}/${env.toLowerCase()}/${rscId}`,
        },
      )}`;
      return url;
    }
    const siteGrapanaUrl = () => {
      const siteStr = whereIsSite(siteId);
      console.log('[siteStr] ', siteStr);
      if (siteStr.indexOf('-cq') > -1) {
        return 'http://grafana.cqhcpp01.skhynix-cq.com.cn/d/QpFay9Qnk/50-resource-service';
      }
      if (siteStr.indexOf('-wx') > -1) {
        return 'http://grafana.wxhcpp01.skhynix.com.cn/grafana/d/1FlwrimVk/50-resource-service';
      }
      if (siteStr.indexOf('-aic') > -1) {
        return 'http://grafana.aicc01.skhynix.com/d/XYddMeTMz/50-resource-service';
      }
      return 'http://grafana.skhynix.com/d/XYddMeTMz/50-resource-service';
    };

    // gls 조건 제거요청으로 pass처리 (23.3.16)
    // const glsGrafanaURL = (glsLocId) => {
    //   if (glsLocId === 'hy-koic-icp-gls-p01')
    //     return 'http://grafana-gausslabs.skhynix.com/grafana/d/nFST3XPMk/50-resource-service';
    //   if (glsLocId === 'hy-koic-k8s-gls-p01')
    //     return 'http://grafana.gls01.skhynix.com/grafana/d/nFST3XPMk/50-resource-service';
    //   return siteGrapanaUrl();
    // };

    const url = siteGrapanaUrl();

    // console.log('[check url is] ', siteId, url);
    return `${url}?${query({
      orgId: 1,
      'var-Clusters': locId,
      'var-label_prjId': prjId,
      'var-label_target': target,
      'var-label_env': env.toLowerCase(),
      'var-label_rscId': rscId,
    })}`;
  },
);

export { getGrafanaUrl };
