package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.cronjob.dto.ExpiryProcessResult;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiInfo;
import com.skhynix.hcp.arch.gateway.cronjob.mapper.SysEmpNoExpiryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalExpiryTxService {

    private static final String EXPIRE_PERMISSION_REJ_MEMO = "시스템 계정 승인 기간 만료로 구독 권한 신청이 반려되었습니다.";
    private static final String EXPIRE_CANCEL_MEMO = "시스템 계정 승인 기간 만료로 구독이 해제되었습니다.";
    private static final String EXPIRE_REJECT_MEMO = "시스템 계정 승인 기간 만료로 구독 신청이 반려되었습니다.";

    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final ExpiryProcessService expiryProcessService;

    @Transactional
    public ExpiryProcessResult processExpiryTargets(String sysEmpNo) {
        ExpiryProcessResult result = new ExpiryProcessResult();

        // 1. 구독 권한 신청 반려
        List<HcpApiInfo> permissionReqList = sysEmpNoExpiryMapper.getPermissionReqBySysEmpNo(sysEmpNo);
        int permissionReqUpdatedCnt = expiryProcessService.updateReqToRejBySysEmpNo(permissionReqList);

        log.info("{}건 구독 권한 신청 반려했습니다. sysEmpNo={}", permissionReqUpdatedCnt, sysEmpNo);

        if (permissionReqUpdatedCnt > 0) {
            validateUpdateResult(permissionReqList, permissionReqUpdatedCnt, "구독 권한 신청 반려");
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
                .collect(Collectors.toList());

        if (!CollectionUtils.isEmpty(aprApiInfos)) {
            int updatedCnt = expiryProcessService.updateSubscriptionStatus(aprApiInfos);
            validateUpdateResult(aprApiInfos, updatedCnt, "구독 신청 반려");
            expiryProcessService.insertActionHistory(aprApiInfos, EXPIRE_REJECT_MEMO);
            result.setRejectedList(aprApiInfos);
        }

        // 4. 정상 구독 -> 해제
        List<HcpApiInfo> norApiInfos = apiInfos.stream()
                .filter(item -> "NOR".equalsIgnoreCase(item.getBeforeSubStatCd()))
                .collect(Collectors.toList());

        if (!CollectionUtils.isEmpty(norApiInfos)) {
            int updatedCnt = expiryProcessService.updateSubscriptionStatus(norApiInfos);
            validateUpdateResult(norApiInfos, updatedCnt, "구독 해제");
            expiryProcessService.deleteApiQos(norApiInfos);
            expiryProcessService.insertActionHistory(norApiInfos, EXPIRE_CANCEL_MEMO);
            result.setUnsubscribedList(norApiInfos);
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
}