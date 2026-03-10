/**
 * 구독 승인
 *
 * @param hcpApiSubList 구독 승인 대상 목록
 * @param empNo 승인자 사번
 * @param account 계정 정보
 */
@Transactional
public void confirm(List<HcpApiSub> hcpApiSubList, String empNo, Account account) {
    if (CollectionUtils.isEmpty(hcpApiSubList)) {
        throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인할 API가 없습니다.");
    }

    Set<Long> svcIds = new HashSet<>();
    Map<Long, String> svcTypeCacheMap = new HashMap<>();

    int updateCnt = 0;

    for (HcpApiSub sub : hcpApiSubList) {
        sub.setEmpNo(empNo);
        sub.setBeforeSubStatCd("APR");

        Long svcId = sub.getSvcId();
        Long keyId = sub.getKeyId();
        svcIds.add(svcId);

        String svcType = svcTypeCacheMap.computeIfAbsent(
                svcId,
                hcpApiSvcMapper::getHcpSvcType
        );

        // 1. CTS 승인 처리
        if ("CTS".equalsIgnoreCase(svcType)) {
            confirmCtsSubscription(keyId);
        }

        // 2. 구독 상태 업데이트
        updateCnt += hcpApiSubMapper.updateApiSub(sub);
    }

    if (updateCnt == 0) {
        throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인된 API가 없습니다. 잘못된 요청입니다.");
    }

    // 3. DRM 승인 처리
    // 서비스타입은 첫번째 항목만 봐도 된다는 전제
    HcpApiSub firstSub = hcpApiSubList.get(0);
    String firstSvcType = svcTypeCacheMap.computeIfAbsent(
            firstSub.getSvcId(),
            hcpApiSvcMapper::getHcpSvcType
    );

    if ("DRM".equalsIgnoreCase(firstSvcType)) {
        confirmDrmSubscription(firstSub);
    }

    // 4. 기본 QoS 등록
    hcpApiQosService.registApiQosWithDefaultBySub(hcpApiSubList);

    // 5. 이력 및 알림
    for (Long svcId : svcIds) {
        commonService.actionHistory(svcId, "SPR", empNo, "구독 신청이 승인되었습니다.");
        sendApproveNotification(svcId, firstSub.getKeyId(), empNo, account);
    }
}

private void confirmDrmSubscription(HcpApiSub sub) {
    validateDrmApprovalTarget(sub);

    HcpApiKeySys mapping = hcpApiSvcMapper.findSysEmpNoMapping(
            sub.getSvcId(),
            sub.getKeyId(),
            env.toUpperCase()
    );

    if (mapping == null || StringUtils.isBlank(mapping.getSysEmpNo())) {
        throw new RestException(ResponseCode.BAD_REQUEST, "승인할 시스템 사번 매핑 정보가 없습니다.");
    }

    sub.setSysEmpNo(mapping.getSysEmpNo());

    updateIfApiKey(
            HcpApiKeySys.builder()
                    .svcId(mapping.getSvcId())
                    .keyId(mapping.getKeyId())
                    .sysEmpNo(mapping.getSysEmpNo())
                    .svcEnv(mapping.getSvcEnv())
                    .build()
    );
}


private void validateDrmApprovalTarget(HcpApiSub sub) {
    if (sub == null) {
        throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인 정보가 없습니다.");
    }

    if (sub.getSvcId() == null || sub.getSvcId() <= 0) {
        throw new RestException(ResponseCode.BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
    }

    if (sub.getKeyId() == null || sub.getKeyId() <= 0) {
        throw new RestException(ResponseCode.BAD_REQUEST, "키 ID가 유효하지 않습니다.");
    }

    HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(sub.getKeyId());
    if (key == null) {
        throw new RestException(ResponseCode.NOT_FOUND, "존재하지 않는 키입니다.");
    }

    if (!"SYS".equalsIgnoreCase(key.getAuthCd())) {
        throw new RestException(ResponseCode.BAD_REQUEST, "시스템 타입 키만 DRM 승인 처리할 수 있습니다.");
    }
}

private void updateIfApiKey(HcpApiKeySys hcpApiKeySys) {
    int affected;

    if ("STG".equalsIgnoreCase(env)) {
        affected = hcpApiSvcMapper.updateIFApiKeyFromStg(hcpApiKeySys);
    } else {
        affected = hcpApiSvcMapper.updateIFApiKey(hcpApiKeySys);
    }

    if (affected <= 0) {
        log.warn("I/F 테이블 업데이트 대상 없음 - svcId={}, keyId={}, sysEmpNo={}",
                hcpApiKeySys.getSvcId(),
                hcpApiKeySys.getKeyId(),
                hcpApiKeySys.getSysEmpNo());

        throw new RestException(ResponseCode.BAD_REQUEST, "시스템 사번 I/F 반영 대상이 없습니다.");
    }
}

private void sendApproveNotification(Long svcId, Long keyId, String empNo, Account account) {
    String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;

    Map<String, Object> hashMap = Map.of(
            "svcId", svcId,
            "keyId", keyId,
            "empNo", empNo
    );

    List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
    List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);

    if (CollectionUtils.isEmpty(hcpApiSvcDtl)) {
        log.warn("서비스 상세 정보 없음 - svcId={}", svcId);
        return;
    }

    String serviceName = String.valueOf(hcpApiSvcDtl.get(0).get("svcNm"));

    Map<String, Object> templateHashMap = new HashMap<>();
    templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
    templateHashMap.put("message", serviceName + "의 구독 신청이 승인되었습니다.");
    templateHashMap.put("message1", "API G/W 에 반영되는데 1~2분 가량 소요됩니다.");
    templateHashMap.put("urlLink", url);

    // 채널 알림
    templateHashMap.put("userId", "");
    templateHashMap.put("channelId", cubeChannelId);
    myPageService.notificate(templateHashMap);

    // 개인 알림
    if (CollectionUtils.isNotEmpty(userList)) {
        templateHashMap.put("userId", userList.get(0));
        templateHashMap.put("channelId", "");
        myPageService.notificate(templateHashMap);
    }

    commonService.workplaceNotify(
            accountUtil.getSiteIdDefaultIfNull(account),
            "[승인]" + serviceName + "의 구독 신청이 승인되었습니다.",
            "[Approve]" + serviceName + " subscription approved",
            "[Approve]" + serviceName + " subscription approved",
            NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
            "API G/W 에 반영되는데 1~2분 가량 소요됩니다.",
            "API G/W Adapted 1~2 minutes later",
            "API G/W Adapted 1~2 minutes later",
            url,
            userList
    );
}






