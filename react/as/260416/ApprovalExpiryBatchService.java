package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.cronjob.dto.*;
import com.skhynix.hcp.arch.gateway.cronjob.mapper.SysEmpNoExpiryMapper;
import com.skhynix.hcp.arch.gateway.store.mapper.HcpApiSvcActHistMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalExpiryBatchService {

    private static final String EXPIRE_PERMISSION_REJ_MEMO = "시스템 계정 승인 기간 만료로 구독 권한 신청이 반려되었습니다.";
    private static final String EXPIRE_CANCEL_MEMO = "시스템 계정 승인 기간 만료로 구독이 해제되었습니다.";
    private static final String EXPIRE_REJECT_MEMO = "시스템 계정 승인 기간 만료로 구독 신청이 반려되었습니다.";

    @Value("${hcp.application.env}")
    private String env;

    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;
    private final OpaDataService opaDataService;
    private final ExpiryProcessService expiryProcessService;
    private final NotificationService notificationService;

    public void sysEmpNoExpiryProcess() {
        expiryProcessService.deleteApprovalSysEmpNo();

        List<String> expiredSysEmpNoList = expiryProcessService.getExpiredSysEmpNo();
        if (CollectionUtils.isEmpty(expiredSysEmpNoList)) {
            log.info("승인 기간 만료된 시스템 계정이 없습니다. env={}", env);
            return;
        }

        expiryProcessService.insertExpirySysEmpNos(expiredSysEmpNoList);

        List<HcpApiExpiredSysEmpNo> targets = expiryProcessService.getUpdateExpirySysEmpNos();
        if (CollectionUtils.isEmpty(targets)) {
            log.info("배치 처리 대상 시스템 계정이 없습니다. env={}", env);
            return;
        }

        log.info("승인 기간 만료된 시스템 계정 {}건 조회. env={}, sysEmpNoList={}",
                targets.size(), env, targets);

        for (HcpApiExpiredSysEmpNo target : targets) {
            try {
                processOneTarget(target);
            } catch (Exception e) {
                log.error("시스템 계정 승인 기간 만료 배치 처리 실패. sysEmpNo={}", target.getSysEmpNo(), e);
            }
        }
    }

    @Transactional
    public void processOneTarget(HcpApiExpiredSysEmpNo target) {
        String sysEmpNo = target.getSysEmpNo();

        HcpApiBatchHist batchHist = new HcpApiBatchHist(sysEmpNo);
        hcpApiSvcActHistMapper.insertStartBatchBySysEmpNo(batchHist);

        target.updateBatchStatCd(BatchStatus.PROCESSING);
        sysEmpNoExpiryMapper.updateBatchStatusBySysEmpNo(target);

        try {
            ExpiryProcessResult result = processExpiryTargets(sysEmpNo);

            if (!CollectionUtils.isEmpty(result.getPermissionRejectedList())) {
                sendRejectNotifications(
                        result.getPermissionRejectedList(),
                        "시스템 사번 승인 기간 만료로 인한 구독 권한 신청 반려"
                );
            }

            if (!CollectionUtils.isEmpty(result.getRejectedList())) {
                sendRejectNotifications(
                        result.getRejectedList(),
                        "시스템 사번 승인 기간 만료로 인한 구독 신청 반려"
                );
            }

            if (!CollectionUtils.isEmpty(result.getUnsubscribedList())) {
                callGatewayPolicySync();
                sendUnsubscribeNotifications(
                        result.getUnsubscribedList(),
                        "시스템 사번 승인 기간 만료로 인한 구독 해지"
                );
            }

            batchHist.finish();
            updateEndBatchBySysEmpNo(batchHist);

        } catch (Exception e) {
            target.updateBatchStatCd(BatchStatus.FAIL);
            sysEmpNoExpiryMapper.updateBatchStatusBySysEmpNo(target);
            throw e;
        }
    }

    @Transactional
    public ExpiryProcessResult processExpiryTargets(String sysEmpNo) {
        ExpiryProcessResult result = new ExpiryProcessResult();

        // 1. 구독 권한 신청 반려
        List<HcpApiInfo> permissionReqList = sysEmpNoExpiryMapper.getPermissionReqBySysEmpNo(sysEmpNo);
        int permissionReqUpdatedCnt = expiryProcessService.updateReqToRejBySysEmpNo(permissionReqList);
        log.info("{}건 구독 권한 신청 반려했습니다. sysEmpNo={}", permissionReqUpdatedCnt, sysEmpNo);

        if (permissionReqUpdatedCnt > 0) {
            result.setPermissionRejectedList(permissionReqList);
            expiryProcessService.insertActionHistory(permissionReqList, EXPIRE_PERMISSION_REJ_MEMO);
        }

        // 2. 구독/구독 신청 대상 조회
        List<HcpApiInfo> subscribeIds = expiryProcessService.getSubscribeIdBySysEmpNo(sysEmpNo);
        List<HcpApiInfo> apiInfos = expiryProcessService.getApiInfoByIdList(subscribeIds);

        if (CollectionUtils.isEmpty(apiInfos)) {
            log.info("만료된 시스템 계정의 구독 대상 API 정보가 없습니다. sysEmpNo={}", sysEmpNo);
            return result;
        }

        log.info("구독 반려 및 해제 대상 API 정보 {}건 조회. sysEmpNo={}", apiInfos.size(), sysEmpNo);

        // 3. 구독 신청 -> 반려
        List<HcpApiInfo> aprApiInfos = apiInfos.stream()
                .filter(item -> "APR".equalsIgnoreCase(item.getBeforeSubStatCd()))
                .toList();

        if (!CollectionUtils.isEmpty(aprApiInfos)) {
            int updatedCnt = expiryProcessService.updateSubscriptionStatus(aprApiInfos);
            validateUpdateResult(aprApiInfos, updatedCnt, "구독 신청 반려");
            expiryProcessService.insertActionHistory(aprApiInfos, EXPIRE_REJECT_MEMO);
            result.setRejectedList(aprApiInfos);
        }

        // 4. 정상 구독 -> 해제
        List<HcpApiInfo> norApiInfos = apiInfos.stream()
                .filter(item -> "NOR".equalsIgnoreCase(item.getBeforeSubStatCd()))
                .toList();

        if (!CollectionUtils.isEmpty(norApiInfos)) {
            int updatedCnt = expiryProcessService.updateSubscriptionStatus(norApiInfos);
            validateUpdateResult(norApiInfos, updatedCnt, "구독 해제");
            expiryProcessService.deleteApiQos(norApiInfos);
            expiryProcessService.insertActionHistory(norApiInfos, EXPIRE_CANCEL_MEMO);
            result.setUnsubscribedList(norApiInfos);
        }

        return result;
    }

    private void sendRejectNotifications(List<HcpApiInfo> rejectList, String reason) {
        Map<String, HcpApiInfo> uniqueTargets = groupByProjectAndService(rejectList);

        uniqueTargets.values().forEach(item ->
                notificationService.rejectCubeNotification(item.getPrjId(), item.getSvcId(), reason)
        );
    }

    private void sendUnsubscribeNotifications(List<HcpApiInfo> unsubscribeList, String reason) {
        Map<String, HcpApiInfo> uniqueTargets = groupByProjectAndService(unsubscribeList);

        uniqueTargets.values().forEach(item ->
                notificationService.unsubscribeCubeNotification(item.getPrjId(), item.getSvcId(), reason)
        );
    }

    private Map<String, HcpApiInfo> groupByProjectAndService(List<HcpApiInfo> apiInfos) {
        Map<String, HcpApiInfo> result = new LinkedHashMap<>();

        for (HcpApiInfo item : apiInfos) {
            if (item.getPrjId() == null || item.getSvcId() == null) {
                log.warn("알림 대상 그룹핑 스킵 - prjId 또는 svcId 없음. prjId={}, svcId={}, keyId={}",
                        item.getPrjId(), item.getSvcId(), item.getKeyId());
                continue;
            }

            String key = item.getPrjId() + "_" + item.getSvcId();
            result.putIfAbsent(key, item);
        }

        return result;
    }

    private void validateUpdateResult(List<HcpApiInfo> apiInfos, int updatedCnt, String actionName) {
        if (updatedCnt == 0) {
            log.warn("{} 업데이트 건수가 0건입니다. targetCount={}", actionName, apiInfos.size());
        }

        if (updatedCnt != apiInfos.size()) {
            log.warn("{} 반영 건수가 다릅니다. expected={}, actual={}", actionName, apiInfos.size(), updatedCnt);
        }
    }

    private void callGatewayPolicySync() {
        try {
            opaDataService.generateOpaTar();
            log.info("게이트웨이 정책 반영 완료");
        } catch (Exception e) {
            log.error("게이트웨이 정책 반영 실패", e);
            throw e;
        }
    }

    private void updateEndBatchBySysEmpNo(HcpApiBatchHist batchHistDto) {
        int histUpdateCnt = hcpApiSvcActHistMapper.updateEndBatchBySysEmpNo(batchHistDto);
        if (histUpdateCnt <= 0) {
            throw new IllegalStateException("배치 종료 이력 업데이트 실패. sysEmpNo=" + batchHistDto.getSysEmpNo());
        }

        HcpApiExpiredSysEmpNo expiredSysEmpNo = new HcpApiExpiredSysEmpNo();
        expiredSysEmpNo.setSysEmpNo(batchHistDto.getSysEmpNo());
        expiredSysEmpNo.updateBatchStatCd(BatchStatus.COMPLETE);

        int statusUpdateCnt = sysEmpNoExpiryMapper.updateBatchStatusBySysEmpNo(expiredSysEmpNo);
        if (statusUpdateCnt <= 0) {
            throw new IllegalStateException("배치 상태 완료 업데이트 실패. sysEmpNo=" + batchHistDto.getSysEmpNo());
        }
    }
}
