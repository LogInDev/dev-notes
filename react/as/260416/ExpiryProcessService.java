package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiExpiredSysEmpNo;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiInfo;
import com.skhynix.hcp.arch.gateway.cronjob.mapper.SysEmpNoExpiryMapper;
import com.skhynix.hcp.arch.gateway.store.dto.HcpApiSvcActHist;
import com.skhynix.hcp.arch.gateway.store.mapper.HcpApiQosMapper;
import com.skhynix.hcp.arch.gateway.store.mapper.HcpApiSvcActHistMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpiryProcessService {

    private final HcpApiQosMapper hcpApiQosMapper;
    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;

    public List<String> getExpiredSysEmpNo() {
        List<String> result = sysEmpNoExpiryMapper.getExpiredSysEmpNoByAccountStatus();
        return result == null ? Collections.emptyList() : result;
    }

    public List<HcpApiInfo> getSubscribeIdBySysEmpNo(String sysEmpNo) {
        List<HcpApiInfo> result = sysEmpNoExpiryMapper.getSubscribeIdBySysEmpNo(sysEmpNo);
        return result == null ? Collections.emptyList() : result;
    }

    public int updateReqToRejBySysEmpNo(List<HcpApiInfo> permissionReqList) {
        if (CollectionUtils.isEmpty(permissionReqList)) {
            return 0;
        }

        permissionReqList.forEach(HcpApiInfo::setUpdateParamToPermissionRej);
        return sysEmpNoExpiryMapper.updateReqToRejBySysEmpNo(permissionReqList);
    }

    public List<HcpApiInfo> getApiInfoByIdList(List<HcpApiInfo> keySvcIds) {
        if (CollectionUtils.isEmpty(keySvcIds)) {
            return Collections.emptyList();
        }

        List<HcpApiInfo> result = sysEmpNoExpiryMapper.getApiInfoByIdList(keySvcIds);
        return result == null ? Collections.emptyList() : result;
    }

    public int updateSubscriptionStatus(List<HcpApiInfo> apiInfos) {
        if (CollectionUtils.isEmpty(apiInfos)) {
            return 0;
        }

        int updateCount = 0;
        for (HcpApiInfo apiInfo : apiInfos) {
            setUpdateParam(apiInfo);

            int affectedRow = sysEmpNoExpiryMapper.updateApiSub(apiInfo);
            if (affectedRow <= 0) {
                log.warn("구독 상태 업데이트 대상 없음. svcId={}, keyId={}, prjId={}, sysEmpNo={}, beforeSubStatCd={}",
                        apiInfo.getSvcId(), apiInfo.getKeyId(), apiInfo.getPrjId(),
                        apiInfo.getSysEmpNo(), apiInfo.getBeforeSubStatCd());
            }
            updateCount += affectedRow;
        }

        log.info("구독 상태 업데이트 완료. requestedCount={}, updatedCount={}", apiInfos.size(), updateCount);
        return updateCount;
    }

    public void insertActionHistory(List<HcpApiInfo> apiInfos, String memo) {
        if (CollectionUtils.isEmpty(apiInfos)) {
            return;
        }

        List<HcpApiSvcActHist> histories = apiInfos.stream()
                .map(apiInfo -> HcpApiSvcActHist.builder()
                        .svcId(apiInfo.getSvcId())
                        .actCd(apiInfo.getHistStatCd())
                        .memo(memo)
                        .build())
                .collect(Collectors.toList());

        int insertCnt = hcpApiSvcActHistMapper.insertApiSvcActHist(histories);
        log.info("구독 관련 이력 저장 완료. requestedCount={}, insertedCount={}", histories.size(), insertCnt);

        if (insertCnt != histories.size()) {
            log.warn("구독 관련 이력이 일부만 저장되었습니다. expected={}, actual={}", histories.size(), insertCnt);
        }
    }

    public void deleteApiQos(List<HcpApiInfo> apiInfos) {
        if (CollectionUtils.isEmpty(apiInfos)) {
            return;
        }

        int deleteCnt = hcpApiQosMapper.deleteApiQos(apiInfos);
        log.info("API QoS 삭제 완료. deleteCount={}", deleteCnt);
    }

    public void deleteApprovalSysEmpNo() {
        int deleteCnt = sysEmpNoExpiryMapper.deleteUnexpired();
        log.info("HCP_API_EXPIRED_SYSEMPNO 삭제 완료. deleteCount={}", deleteCnt);
    }

    public void insertExpirySysEmpNos(List<String> sysEmpNoList) {
        if (CollectionUtils.isEmpty(sysEmpNoList)) {
            return;
        }

        int insertCnt = sysEmpNoExpiryMapper.insertBatchHistIfNotExists(sysEmpNoList);
        log.info("HCP_API_EXPIRED_SYSEMPNO 추가 완료. insertCount={}", insertCnt);
    }

    public List<HcpApiExpiredSysEmpNo> getUpdateExpirySysEmpNos() {
        List<HcpApiExpiredSysEmpNo> result = sysEmpNoExpiryMapper.getUpdatedExpirySysEmpNos();
        return result == null ? Collections.emptyList() : result;
    }

    private void setUpdateParam(HcpApiInfo apiInfo) {
        if ("APR".equalsIgnoreCase(apiInfo.getBeforeSubStatCd())) {
            apiInfo.setUpdateParamToRejected();
            return;
        }

        if ("NOR".equalsIgnoreCase(apiInfo.getBeforeSubStatCd())) {
            apiInfo.setUpdateParamToCancelled();
            return;
        }

        throw new IllegalArgumentException(
                "지원하지 않는 beforeSubStatCd 입니다. svcId=" + apiInfo.getSvcId()
                        + ", keyId=" + apiInfo.getKeyId()
                        + ", prjId=" + apiInfo.getPrjId()
                        + ", beforeSubStatCd=" + apiInfo.getBeforeSubStatCd()
        );
    }
}
