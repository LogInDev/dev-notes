package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.store.mapper.HcpApiSvcMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    @Value("${hcp.apistore.url}")
    private String linkUrl;

    @Value("${hcp.cube.channel}")
    private String cubeChannelId;

    private final HcpApiSvcMapper hcpApiSvcMapper;
    private final CubeNotificationService cubeNotiService;

    public void unsubscribeCubeNotification(Long prjId, Long svcId, String reason) {
        sendProjectNotification(
                prjId,
                svcId,
                "**API Store 구독 해지 알림**",
                "의 구독이 해지되었습니다.",
                "구독 해지 사유 : " + reason
        );
    }

    public void rejectCubeNotification(Long prjId, Long svcId, String reason) {
        sendProjectNotification(
                prjId,
                svcId,
                "**API Store 구독 신청 반려 알림**",
                "의 구독 신청이 반려되었습니다.",
                "반려 사유 : " + reason
        );
    }

    private void sendProjectNotification(Long prjId, Long svcId, String title, String messageSuffix, String message1) {
        if (prjId == null) {
            log.info("알림 스킵 - prjId 없음. svcId={}", svcId);
            return;
        }

        List<Map<String, String>> managerList = hcpApiSvcMapper.getPrjManagerEmpNoList(prjId);
        if (CollectionUtils.isEmpty(managerList)) {
            log.info("알림 스킵 - 프로젝트 관리자 없음. prjId={}, svcId={}", prjId, svcId);
            return;
        }

        String serviceName = hcpApiSvcMapper.selectSvcInfDtl(svcId);
        if (!StringUtils.hasText(serviceName)) {
            log.warn("서비스명이 없어 알림을 스킵합니다. svcId={}, prjId={}", svcId, prjId);
            return;
        }

        String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;

        List<String> targetUsers = managerList.stream()
                .map(item -> item.get("empNo"))
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());

        if (CollectionUtils.isEmpty(targetUsers)) {
            log.info("알림 스킵 - 대상 사용자 없음. prjId={}, svcId={}", prjId, svcId);
            return;
        }

        for (String userId : targetUsers) {
            Map<String, Object> templateMap = new HashMap<>();
            templateMap.put("title", title);
            templateMap.put("message", serviceName + messageSuffix);
            templateMap.put("message1", message1);
            templateMap.put("urlLink", url);
            templateMap.put("svcNm", serviceName);
            templateMap.put("user_id", userId);

            try {
                templateMap.put("channelId", cubeChannelId);
                cubeNotiService.notificate(templateMap);

                templateMap.put("channelId", "");
                cubeNotiService.notificate(templateMap);

                log.info("Cube 알림 발송 완료. prjId={}, svcId={}, userId={}", prjId, svcId, userId);
            } catch (Exception e) {
                log.error("Cube 알림 발송 실패. prjId={}, svcId={}, userId={}", prjId, svcId, userId, e);
            }
        }
    }
}
