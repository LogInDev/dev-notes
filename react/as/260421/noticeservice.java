package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiInfo;
import com.skhynix.hcp.arch.gateway.cronjob.mapper.HcpApiSvcActHistMapper;
import com.skhynix.hcp.arch.gateway.store.dto.ApiNotificationCommand;
import com.skhynix.hcp.arch.gateway.store.dto.ApiNotificationContext;
import com.skhynix.hcp.arch.gateway.store.mapper.HcpApiSvcMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;
    private final HcpApiSvcMapper hcpApiSvcMapper;
    private final CubeNotificationService cubeNotiService;

    @Value("${hcp.apistore.url}")
    private String linkUrl;

    @Value("${hcp.cube.channel}")
    private String cubeChannelId;

    public void cubeNotification(List<HcpApiInfo> apiInfos, String actHistType) {
        if (CollectionUtils.isEmpty(apiInfos)) {
            return;
        }

        Map<Long, List<HcpApiInfo>> groupedBySvcId = apiInfos.stream()
                .filter(item -> item.getSvcId() != null)
                .collect(Collectors.groupingBy(HcpApiInfo::getSvcId));

        for (Map.Entry<Long, List<HcpApiInfo>> entry : groupedBySvcId.entrySet()) {
            Long svcId = entry.getKey();
            List<HcpApiInfo> svcApiInfos = entry.getValue();

            Set<String> managerList = getPrjManagerList(svcApiInfos);
            if (CollectionUtils.isEmpty(managerList)) {
                log.info("알림 스킵 - 프로젝트 관리자 없음. svcId={}", svcId);
                continue;
            }

            String reason = svcApiInfos.stream()
                    .map(HcpApiInfo::getAprvReason)
                    .filter(StringUtils::hasText)
                    .findFirst()
                    .orElse("");

            ApiNotificationContext context = buildContext(svcId, managerList);
            if (context == null) {
                continue;
            }

            ApiNotificationCommand command = createCommand(actHistType, context.getServiceName(), reason);
            if (command == null) {
                log.warn("알림 스킵 - 지원하지 않는 actHistType. actHistType={}", actHistType);
                continue;
            }

            notify(context, command);
        }
    }

    private ApiNotificationCommand createCommand(String actHistType, String svcNm, String reason) {
        switch (actHistType) {
            case "REJ":
                return ApiNotificationCommand.setPermissionReject(svcNm, reason);
            case "SEJ":
                return ApiNotificationCommand.setReject(svcNm, reason);
            case "CCL":
                return ApiNotificationCommand.setUnsbuscribe(svcNm, reason);
            default:
                return null;
        }
    }

    private ApiNotificationContext buildContext(Long svcId, Set<String> receiverList) {
        String serviceName = hcpApiSvcMapper.selectSvcInfDtl(svcId);
        if (!StringUtils.hasText(serviceName)) {
            log.warn("svcId가 {}인 API Store가 없습니다.", svcId);
            return null;
        }

        String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;

        return ApiNotificationContext.builder()
                .svcId(svcId)
                .serviceName(serviceName)
                .url(url)
                .targetUserList(receiverList)
                .build();
    }

    private Set<String> getPrjManagerList(List<HcpApiInfo> apiInfos) {
        Set<String> prjIdSet = apiInfos.stream()
                .map(HcpApiInfo::getPrjId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (CollectionUtils.isEmpty(prjIdSet)) {
            return Collections.emptySet();
        }

        return hcpApiSvcActHistMapper.getMngUsersByPrjId(prjIdSet);
    }

    private void notify(ApiNotificationContext context, ApiNotificationCommand command) {
        if (context == null || CollectionUtils.isEmpty(context.getTargetUserList())) {
            log.info("알림 스킵 - 대상 사용자 없음. svcId={}", context != null ? context.getSvcId() : null);
            return;
        }

        for (String userId : context.getTargetUserList()) {
            sendCubeNotification(context, command, userId);
        }
    }

    private void sendCubeNotification(ApiNotificationContext context, ApiNotificationCommand command, String userId) {
        Map<String, Object> templateMap = new HashMap<>();
        templateMap.put("title", command.getCubeTitle());
        templateMap.put("message", command.getCubeMessage());
        templateMap.put("urlLink", context.getUrl());
        templateMap.put("svcNm", context.getServiceName());
        templateMap.put("user_id", userId);
        templateMap.put("message1", command.getCubeMessage1());

        try {
            templateMap.put("channelId", cubeChannelId);
            cubeNotiService.notificate(templateMap);

            templateMap.put("channelId", "");
            cubeNotiService.notificate(templateMap);

            log.info("Cube 알림 발송 완료. svcId={}, userId={}", context.getSvcId(), userId);
        } catch (Exception e) {
            log.error("Cube 알림 발송 실패. svcId={}, userId={}", context.getSvcId(), userId, e);
        }
    }
}