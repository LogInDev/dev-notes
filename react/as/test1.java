package com.example.service;

import com.example.mapper.HcpApiQosMapper;
import com.example.mapper.HcpApiSvcActHistMapper;
import com.example.mapper.SysEmpNoExpiryMapper;
import com.example.model.HcpApiInfo;
import com.example.model.HcpApiSvcActHist;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalExpiryService {

    private static final String IF_TABLE_NAME = "IDM_USR_TBL";
    private static final String EXPIRE_MEMO = "시스템 사번 승인 기간 만료로 구독이 해제되었습니다.";

    @Value("${hcp.application.env}")
    private String env;

    @Value("${hcp.svc.api-store.sub-url:}")
    private String hcpSvcApiStoreUrl;

    private final ApiGatewayService apiGatewayService;
    private final HcpApiQosMapper hcpApiQosMapper;
    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;

    /**
     * 스케줄러 진입점
     */
    public void sysEmpNoExpiryCheckProcess() {
        String resolvedTableName = resolveTableNameByEnvironment(IF_TABLE_NAME);

        List<String> expiredSysEmpNoList =
                sysEmpNoExpiryMapper.getExpiredSysEmpNoByAccountStatus(resolvedTableName);

        if (CollectionUtils.isEmpty(expiredSysEmpNoList)) {
            log.info("승인 기간 만료된 시스템 사번이 없습니다. tableName={}", resolvedTableName);
            return;
        }

        log.info("승인 기간 만료된 시스템 사번 {}건 조회. tableName={}, sysEmpNoList={}",
                expiredSysEmpNoList.size(), resolvedTableName, expiredSysEmpNoList);

        ExpiryProcessResult result = processExpiryTargets(expiredSysEmpNoList);

        log.info("승인 만료 구독 해제 처리 완료. updatedCount={}, ifDeleteCount={}, keyDeleteCount={}, qosDeleteCount={}, historyInsertCount={}",
                result.getUpdatedCount(),
                result.getIfDeleteCount(),
                result.getKeyDeleteCount(),
                result.getQosDeleteCount(),
                result.getHistoryInsertCount());

        callGatewayPolicySync(result);
    }

    /**
     * DB 처리 전용 트랜잭션
     */
    @Transactional
    public ExpiryProcessResult processExpiryTargets(List<String> sysEmpNoList) {
        validateSysEmpNoList(sysEmpNoList);

        List<HcpApiInfo> apiInfos = sysEmpNoExpiryMapper.getApiInfoBySysEmpNo(sysEmpNoList);

        if (CollectionUtils.isEmpty(apiInfos)) {
            log.warn("만료 시스템 사번은 존재하지만 구독 대상 API 정보가 없습니다. sysEmpNoList={}", sysEmpNoList);
            return ExpiryProcessResult.empty();
        }

        log.info("구독 해제 대상 API 정보 {}건 조회", apiInfos.size());

        int updatedCount = updateSubscriptionStatusToCancelled(apiInfos);
        validateUpdateResult(apiInfos, updatedCount);

        int ifDeleteCount = deleteInterfaceApiKeys(sysEmpNoList);
        int keyDeleteCount = deleteSysEmpNo(apiInfos);
        int qosDeleteCount = deleteApiQos(apiInfos);
        int historyInsertCount = insertActionHistory(apiInfos, EXPIRE_MEMO);

        return ExpiryProcessResult.builder()
                .updatedCount(updatedCount)
                .ifDeleteCount(ifDeleteCount)
                .keyDeleteCount(keyDeleteCount)
                .qosDeleteCount(qosDeleteCount)
                .historyInsertCount(historyInsertCount)
                .processedTargetCount(apiInfos.size())
                .build();
    }

    private void validateSysEmpNoList(List<String> sysEmpNoList) {
        if (CollectionUtils.isEmpty(sysEmpNoList)) {
            throw new IllegalArgumentException("시스템 사번 목록이 비어 있습니다.");
        }
    }

    private int updateSubscriptionStatusToCancelled(List<HcpApiInfo> apiInfos) {
        int updateCount = 0;

        for (HcpApiInfo apiInfo : apiInfos) {
            try {
                apiInfo.setUpdateParamToCancelled();
                int affectedRow = sysEmpNoExpiryMapper.updateApiSub(apiInfo);

                if (affectedRow <= 0) {
                    log.warn("구독 상태 업데이트 대상 없음. svcId={}, sysEmpNo={}",
                            apiInfo.getSvcId(), apiInfo.getSysEmpNo());
                }

                updateCount += affectedRow;
            } catch (Exception e) {
                log.error("구독 상태 업데이트 중 오류 발생. svcId={}, sysEmpNo={}",
                        apiInfo.getSvcId(), apiInfo.getSysEmpNo(), e);
                throw e;
            }
        }

        log.info("구독 상태 업데이트 완료. requestedCount={}, updatedCount={}", apiInfos.size(), updateCount);
        return updateCount;
    }

    private void validateUpdateResult(List<HcpApiInfo> apiInfos, int updatedCount) {
        if (updatedCount == 0) {
            log.warn("구독 상태 업데이트 건수가 0건입니다. targetCount={}", apiInfos.size());
        }

        if (updatedCount != apiInfos.size()) {
            log.warn("예상 업데이트 건수와 실제 업데이트 건수가 다릅니다. expected={}, actual={}",
                    apiInfos.size(), updatedCount);
        }
    }

    private int deleteInterfaceApiKeys(List<String> sysEmpNoList) {
        String resolvedTableName = resolveTableNameByEnvironment(IF_TABLE_NAME);
        int deleteCount = sysEmpNoExpiryMapper.deleteIFApiKey(resolvedTableName, sysEmpNoList);

        log.info("I/F 테이블 API KEY 삭제 완료. tableName={}, deleteCount={}", resolvedTableName, deleteCount);
        return deleteCount;
    }

    private int deleteSysEmpNo(List<HcpApiInfo> apiInfos) {
        String upperEnv = getUpperEnv();
        int deleteCount = sysEmpNoExpiryMapper.deleteSysEmpNo(apiInfos, upperEnv);

        log.info("시스템 사번 삭제 완료. env={}, deleteCount={}", upperEnv, deleteCount);
        return deleteCount;
    }

    private int deleteApiQos(List<HcpApiInfo> apiInfos) {
        int deleteCount = hcpApiQosMapper.deleteApiQos(apiInfos);

        log.info("API QoS 삭제 완료. deleteCount={}", deleteCount);
        return deleteCount;
    }

    private int insertActionHistory(List<HcpApiInfo> apiInfos, String memo) {
        List<HcpApiSvcActHist> histories = apiInfos.stream()
                .map(apiInfo -> HcpApiSvcActHist.builder()
                        .svcId(apiInfo.getSvcId())
                        .actCd(apiInfo.getSubStatCd())
                        .memo(memo)
                        .build())
                .collect(Collectors.toList());

        int insertCount = hcpApiSvcActHistMapper.insertApiSvcActHist(histories);

        log.info("행위 이력 저장 완료. requestedCount={}, insertedCount={}", histories.size(), insertCount);

        if (insertCount != histories.size()) {
            log.warn("행위 이력 저장 건수가 예상과 다릅니다. expected={}, actual={}", histories.size(), insertCount);
        }

        return insertCount;
    }

    /**
     * 외부/후처리 호출은 DB 처리 후 별도 수행
     */
    private void callGatewayPolicySync(ExpiryProcessResult result) {
        if (result.isEmpty()) {
            log.info("게이트웨이 정책 반영 호출 스킵 - 처리 대상 없음");
            return;
        }

        try {
            apiGatewayService.addGatewayPolicyMsg();
            log.info("게이트웨이 정책 반영 메시지 호출 완료");
        } catch (Exception e) {
            log.error("게이트웨이 정책 반영 메시지 호출 실패. 운영 확인 필요", e);

            /**
             * 선택지 1: 외부 호출 실패도 전체 실패로 간주하고 싶으면 throw
             * throw e;
             *
             * 선택지 2: DB는 이미 처리 완료, 외부 후처리만 실패로 보고 로그/재처리 대상으로 남김
             * 현재는 2번 전략으로 둠
             */
        }
    }

    private String resolveTableNameByEnvironment(String baseTableName) {
        return "STG".equalsIgnoreCase(env) ? baseTableName + "_STG" : baseTableName;
    }

    private String getUpperEnv() {
        return env == null ? "" : env.toUpperCase(Locale.ROOT);
    }
}


package com.example.service;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExpiryProcessResult {

    private int processedTargetCount;
    private int updatedCount;
    private int ifDeleteCount;
    private int keyDeleteCount;
    private int qosDeleteCount;
    private int historyInsertCount;

    public static ExpiryProcessResult empty() {
        return ExpiryProcessResult.builder()
                .processedTargetCount(0)
                .updatedCount(0)
                .ifDeleteCount(0)
                .keyDeleteCount(0)
                .qosDeleteCount(0)
                .historyInsertCount(0)
                .build();
    }

    public boolean isEmpty() {
        return processedTargetCount <= 0;
    }
}
