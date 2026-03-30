import lombok.Builder;
import lombok.Getter;

import java.util.Collections;
import java.util.List;

@Getter
@Builder
public class ApiNotificationContext {
    private Long svcId;
    private Long keyId;
    private String empNo;
    private String serviceName;
    private String url;
    private List<String> targetUserList;

    public static ApiNotificationContext empty(Long svcId, Long keyId, String empNo) {
        return ApiNotificationContext.builder()
                .svcId(svcId)
                .keyId(keyId)
                .empNo(empNo)
                .serviceName("")
                .url("")
                .targetUserList(Collections.emptyList())
                .build();
    }

    public boolean hasTargetUsers() {
        return targetUserList != null && !targetUserList.isEmpty();
    }

    public String getFirstTargetUser() {
        return hasTargetUsers() ? targetUserList.get(0) : "";
    }
}

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiNotificationCommand {
    private String cubeTitle;
    private String cubeMessage;
    private String cubeMessage1;

    private boolean sendCube;
    private boolean sendWorkplace;

    private String workplaceTitleKo;
    private String workplaceTitleEn;
    private String workplaceTitleJa;

    private String workplaceMessageKo;
    private String workplaceMessageEn;
    private String workplaceMessageJa;
}


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiNotificationService {

    private final HcpApiMyPageMapper hcpApiMyPageMapper;
    private final HcpApiSvcMapper hcpApiSvcMapper;
    private final CubeNotiService cubeNotiService;
    private final CommonService commonService;
    private final AccountUtil accountUtil;

    // 외부 주입값이라고 가정
    private final String linkUrl = "https://your-host/";
    private final String cubeChannelId = "your-channel-id";

    public ApiNotificationContext buildContext(Long svcId, Long keyId, String empNo) {
        Map<String, Object> queryParam = Map.of(
                "svcId", svcId,
                "keyId", keyId,
                "empNo", empNo
        );

        List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(queryParam);

        if (CollectionUtils.isEmpty(userList)) {
            log.info("알림 대상 사용자가 없습니다. svcId={}, keyId={}, empNo={}", svcId, keyId, empNo);
            return ApiNotificationContext.empty(svcId, keyId, empNo);
        }

        List<Map<String, Object>> svcDetailList = hcpApiSvcMapper.selectSvcInfDtl(svcId);
        if (CollectionUtils.isEmpty(svcDetailList)) {
            throw new RestException(ResponseCode.BAD_REQUEST, "서비스 정보를 찾을 수 없습니다. svcId=" + svcId);
        }

        String serviceName = (String) svcDetailList.get(0).get("svcNm");
        String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;

        return ApiNotificationContext.builder()
                .svcId(svcId)
                .keyId(keyId)
                .empNo(empNo)
                .serviceName(serviceName)
                .url(url)
                .targetUserList(userList)
                .build();
    }

    public void notify(ApiNotificationContext context, ApiNotificationCommand command, Account account) {
        if (context == null || !context.hasTargetUsers()) {
            log.info("알림 스킵 - 대상 사용자 없음. svcId={}", context != null ? context.getSvcId() : null);
            return;
        }

        if (command.isSendCube()) {
            sendCubeNotification(context, command);
        }

        if (command.isSendWorkplace()) {
            sendWorkplaceNotification(context, command, account);
        }
    }

    private void sendCubeNotification(ApiNotificationContext context, ApiNotificationCommand command) {
        Map<String, Object> templateMap = new HashMap<>();
        templateMap.put("title", command.getCubeTitle());
        templateMap.put("message", command.getCubeMessage());
        templateMap.put("urlLink", context.getUrl());

        if (StringUtils.hasText(command.getCubeMessage1())) {
            templateMap.put("message1", command.getCubeMessage1());
        }

        try {
            // 채널 알림
            templateMap.put("userId", "");
            templateMap.put("channelId", cubeChannelId);
            cubeNotiService.notificate(templateMap);

            // 개인 알림
            templateMap.put("userId", context.getFirstTargetUser());
            templateMap.put("channelId", "");
            cubeNotiService.notificate(templateMap);

            log.info("Cube 알림 발송 완료. svcId={}, userId={}", context.getSvcId(), context.getFirstTargetUser());
        } catch (Exception e) {
            log.error("Cube 알림 발송 실패. svcId={}", context.getSvcId(), e);
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "Cube 알림 발송 실패");
        }
    }

    private void sendWorkplaceNotification(ApiNotificationContext context, ApiNotificationCommand command, Account account) {
        try {
            commonService.workplaceNotify(
                    accountUtil.getSiteIdDefaultIfNull(account),
                    command.getWorkplaceTitleKo(),
                    command.getWorkplaceTitleEn(),
                    command.getWorkplaceTitleJa(),
                    NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
                    command.getWorkplaceMessageKo(),
                    command.getWorkplaceMessageEn(),
                    command.getWorkplaceMessageJa(),
                    context.getUrl(),
                    context.getTargetUserList()
            );

            log.info("Workplace 알림 발송 완료. svcId={}, userCount={}", context.getSvcId(), context.getTargetUserList().size());
        } catch (Exception e) {
            log.error("Workplace 알림 발송 실패. svcId={}", context.getSvcId(), e);
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "Workplace 알림 발송 실패");
        }
    }
}


String actCd = "SPR";
String memo = "구독 신청이 승인되었습니다";

for (Long svcId : svcIds) {
    commonService.actionHistory(svcId, actCd, empNo, memo);

    ApiNotificationContext context = apiNotificationService.buildContext(
            svcId,
            hcpApiSubList.get(0).getKeyId(),
            empNo
    );

    String serviceName = context.getServiceName();

    ApiNotificationCommand command = ApiNotificationCommand.builder()
            .sendCube(true)
            .sendWorkplace(true)
            .cubeTitle("**API Store 구독 신청 결과 알림**")
            .cubeMessage(serviceName + "의 구독 신청이 승인되었습니다.")
            .cubeMessage1("API G/W 에 반영되는데 1~2분 가량 소요됩니다.")
            .workplaceTitleKo("[승인]" + serviceName + "의 구독 신청이 승인되었습니다.")
            .workplaceTitleEn("[Approve]" + serviceName + " subscription approved")
            .workplaceTitleJa("[Approve]" + serviceName + " subscription approved")
            .workplaceMessageKo("API G/W 에 반영되는데 1~2분 가량 소요됩니다.")
            .workplaceMessageEn("API G/W Adapted 1~2 minutes later")
            .workplaceMessageJa("API G/W Adapted 1~2 minutes later")
            .build();

    apiNotificationService.notify(context, command, account);
}


String actCd = "SEJ";
String memo = "구독 신청이 반려되었습니다";
String reason = hcpApiSubList.get(0).getAprvReason();

for (Long svcId : svcIds) {
    commonService.actionHistory(svcId, actCd, empNo, memo);

    ApiNotificationContext context = apiNotificationService.buildContext(
            svcId,
            hcpApiSubList.get(0).getKeyId(),
            empNo
    );

    String serviceName = context.getServiceName();
    String rejectMessage = "반려메시지 : " + reason;

    ApiNotificationCommand command = ApiNotificationCommand.builder()
            .sendCube(true)
            .sendWorkplace(true)
            .cubeTitle("**API Store 구독 신청 결과 알림**")
            .cubeMessage(serviceName + "의 구독 신청이 반려되었습니다.")
            .cubeMessage1(rejectMessage)
            .workplaceTitleKo("[반려]" + serviceName + "의 구독 신청이 반려되었습니다.")
            .workplaceTitleEn("[Reject]" + serviceName + " subscription rejected")
            .workplaceTitleJa("[Reject]" + serviceName + " subscription rejected")
            .workplaceMessageKo(rejectMessage)
            .workplaceMessageEn(rejectMessage)
            .workplaceMessageJa(rejectMessage)
            .build();

    apiNotificationService.notify(context, command, account);
}


public ApiNotificationContext buildManagerContext(Long svcId) {
    List<HcpApiSvcMng> managerList = apiSvcMngMapper.getManagerEmpNoList(svcId);
    if (CollectionUtils.isEmpty(managerList)) {
        log.info("서비스 관리자 정보가 없습니다. svcId={}", svcId);
        return ApiNotificationContext.empty(svcId, null, null);
    }

    List<String> targetUsers = managerList.stream()
            .map(HcpApiSvcMng::getEmpNo)
            .collect(Collectors.toList());

    List<Map<String, Object>> svcDetailList = hcpApiSvcMapper.selectSvcInfDtl(svcId);
    if (CollectionUtils.isEmpty(svcDetailList)) {
        throw new RestException(ResponseCode.BAD_REQUEST, "서비스 정보를 찾을 수 없습니다. svcId=" + svcId);
    }

    String serviceName = (String) svcDetailList.get(0).get("svcNm");
    String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;

    return ApiNotificationContext.builder()
            .svcId(svcId)
            .serviceName(serviceName)
            .url(url)
            .targetUserList(targetUsers)
            .build();
}

for (Long svcId : svcIds) {
    commonService.actionHistory(svcId, "SRE", loginEmpNo, "구독 신청이 완료되었습니다.");

    ApiNotificationContext context = apiNotificationService.buildManagerContext(svcId);
    if (!context.hasTargetUsers()) {
        continue;
    }

    String userNm = account.getAccountName() + " (" + loginEmpNo + ")";
    String serviceName = context.getServiceName();

    Map<String, Object> templateMap = new HashMap<>();
    templateMap.put("title", "**API Store 구독 신청 알림**");
    templateMap.put("message", serviceName + "의 구독이 신청되었습니다");
    templateMap.put("user_id", context.getTargetUserList().toArray(new String[0]));
    templateMap.put("svcNm", serviceName);
    templateMap.put("userNm", userNm);
    templateMap.put("urlLink", context.getUrl());
    templateMap.put("regDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
    templateMap.put("channelId", cubeChannelId);

    cubeNotiService.notificate(TEMPLATE_SUBSCRIBE_PATH, templateMap);

    templateMap.put("channelId", "");
    cubeNotiService.notificate(TEMPLATE_SUBSCRIBE_PATH, templateMap);
}


public void notifySubscriptionRequestToManagers(Long svcId, Account account, String loginEmpNo) {
    ApiNotificationContext context = buildManagerContext(svcId);
    if (!context.hasTargetUsers()) {
        return;
    }

    String userNm = account.getAccountName() + " (" + loginEmpNo + ")";

    Map<String, Object> templateMap = new HashMap<>();
    templateMap.put("title", "**API Store 구독 신청 알림**");
    templateMap.put("message", context.getServiceName() + "의 구독이 신청되었습니다");
    templateMap.put("user_id", context.getTargetUserList().toArray(new String[0]));
    templateMap.put("svcNm", context.getServiceName());
    templateMap.put("userNm", userNm);
    templateMap.put("urlLink", context.getUrl());
    templateMap.put("regDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

    try {
        templateMap.put("channelId", cubeChannelId);
        cubeNotiService.notificate(TEMPLATE_SUBSCRIBE_PATH, templateMap);

        templateMap.put("channelId", "");
        cubeNotiService.notificate(TEMPLATE_SUBSCRIBE_PATH, templateMap);

        log.info("구독 신청 관리자 알림 완료. svcId={}, managerCount={}", svcId, context.getTargetUserList().size());
    } catch (Exception e) {
        log.error("구독 신청 관리자 알림 실패. svcId={}", svcId, e);
        throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "구독 신청 관리자 알림 실패");
    }
}
