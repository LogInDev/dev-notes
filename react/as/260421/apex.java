package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.cronjob.dto.ExpiryProcessResult;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiBatchHist;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiExpiredSysEmpNo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalExpiryBatchService {

    @Value("${hcp.application.env}")
    private String env;

    private final ExpiryProcessService expiryProcessService;
    private final ApprovalExpiryTxService approvalExpiryTxService;
    private final ApprovalExpiryBatchStatusService approvalExpiryBatchStatusService;
    private final NotificationService notificationService;
    private final OpaDataService opaDataService;

    public void sysEmpNoExpiryProcess() {
        List<HcpApiExpiredSysEmpNo> sysEmpNoList = expiryProcessService.getExpirySysEmpNos();

        log.info("승인 기간 만료 처리할 시스템 계정 {}건 조회. env={}, sysEmpNoList={}",
                sysEmpNoList.size(), env, sysEmpNoList);

        if (CollectionUtils.isEmpty(sysEmpNoList)) {
            return;
        }

        for (HcpApiExpiredSysEmpNo target : sysEmpNoList) {
            processOneTargetSafely(target);
        }
    }

    private void processOneTargetSafely(HcpApiExpiredSysEmpNo target) {
        HcpApiBatchHist batchHist = null;

        try {
            // 1. 시작 이력 + P 상태 저장 (반드시 남겨야 하므로 REQUIRES_NEW)
            batchHist = approvalExpiryBatchStatusService.startBatch(target);

            // 2. 실제 DB 처리
            ExpiryProcessResult result = approvalExpiryTxService.processExpiryTargets(target.getSysEmpNo());

            // 3. 외부 연동은 트랜잭션 밖
            if (!CollectionUtils.isEmpty(result.getUnsubscribedList())) {
                opaDataService.generateOpaTar();
                log.info("게이트웨이 정책 반영 완료. sysEmpNo={}", target.getSysEmpNo());
            }

            sendNotifications(result);

            // 4. 완료 처리
            approvalExpiryBatchStatusService.completeBatch(target, batchHist);

        } catch (Exception e) {
            log.error("시스템 계정 승인 기간 만료 배치 처리 실패. sysEmpNo={}", target.getSysEmpNo(), e);

            // 5. 실패 처리도 별도 트랜잭션으로 남김
            approvalExpiryBatchStatusService.failBatch(target, batchHist, e);
        }
    }

    private void sendNotifications(ExpiryProcessResult result) {
        if (!CollectionUtils.isEmpty(result.getPermissionRejectedList())) {
            notificationService.cubeNotification(result.getPermissionRejectedList(), "REJ");
        }

        if (!CollectionUtils.isEmpty(result.getRejectedList())) {
            notificationService.cubeNotification(result.getRejectedList(), "SEJ");
        }

        if (!CollectionUtils.isEmpty(result.getUnsubscribedList())) {
            notificationService.cubeNotification(result.getUnsubscribedList(), "CCL");
        }
    }
}