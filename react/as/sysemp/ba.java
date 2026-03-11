 /**
     * 구독 신청
     * @param hcpApiSubList
     * @param empNo
     */
    @Transactional
    public void subscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();
        Set<Long> svcIds = new HashSet<>();
        hcpApiSubList.forEach(it -> {
            svcIds.add(it.getSvcId());
            it.setEmpNo(empNo);

            long svcId = it.getSvcId();
            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if("DRM".equalsIgnoreCase(svcType)){
                validateDrmSubscriptionTarget(it);
                mergeSysEmpNoMapping(it);
            }

            hcpApiSubMapper.mergeApiSub(it);
        });

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "SRE", empNo, "구독 신청이 완료되었습니다.");
        }
    }


    /**
     * 구독 승인
     *
     * @param hcpApiSubList
     * @param empNo
     * @param account
     * @throws Exception
     */
    @Transactional
    public void confirm(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
        Set<Long> svcIds = new HashSet<>();
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();

        int updateCnt = 0;
        for (HcpApiSub it : hcpApiSubList) {
            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("APR");

            long svcId = it.getSvcId();
            svcIds.add(svcId);
            String svcType = svcTypeCacheMap.computeIfAbsent(svcId, k -> hcpApiSvcMapper.getHcpSvcType(svcId));
            if ("CTS".equalsIgnoreCase(svcType)) {
                Long keyId = it.getKeyId();
                // 1. 구독 요청 API 키 정보 조회
                CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

                if (keyInfo == null) {
                    log.error("keyInfo is null - keyId : {}", keyId);
                    throw new RestException(ResponseCode.BAD_REQUEST, "keyInfo is null");
                }

                // 2. CTS구독 프로세스
                try {
                    // 3. 기존 구독 여부 확인
                    boolean checkResult = ctsService.checkAlreadySubscription(keyId);
                    // 4. 구독중이 아니라면 CTS 구독
                    if (!checkResult) {
                        ctsService.subscriptionCts(keyInfo);
                    }
                    // 5. 이미 구독중이라면 PASS
                    else {
                        log.info("already subscribed cts for keyId: {}", hcpApiSubList.get(0).getKeyId());
                    }
                } catch (Exception e) {
                    log.error("cts subscription error! - {}", e.getMessage());
                    throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "cts subscription fail");
                }
            }

            if("DRM".equalsIgnoreCase(svcType)) {
                confirmDrmSubscription(it);
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if( updateCnt == 0){
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인된 API가 없습니다. 잘못된 요청입니다.");
        }

        hcpApiQosService.registApiQosWithDefaultBySub(hcpApiSubList);

        String actCd = "SPR";
        String memo = "구독 신청이 승인되었습니다";
        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, actCd, empNo, memo);

            String url = linkUrl + "apps/hcp-web-api-store/api/detail/"+svcId;
            Map<String, Object> hashMap =Map.of( "svcId", svcId, "keyId", hcpApiSubList.get(0).getKeyId(), "empNo", empNo);
            List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);

            List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);
            String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");

            Map<String, Object> templateHashMap = new HashMap<>();
            templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
            templateHashMap.put("message", serviceName + "의 구독 신청이 승인되었습니다.");
            templateHashMap.put("message1", "API G/W 에 반영되는데 1~2분 가량 소요됩니다.");
            for (int i = 0; i < 2; i++) {
                templateHashMap.put("urlLink", url);
                if (i == 0) {
                    templateHashMap.put("userId", "");
                    String channelId = cubeChannelId;
                    templateHashMap.put("channelId", channelId);

                } else if (i == 1) {
                    templateHashMap.put("userId", userList.get(0));
                    templateHashMap.put("channelId", "");
                }
                myPageService.notificate(templateHashMap);
            }
            commonService.workplaceNotify(
                    accountUtil.getSiteIdDefaultIfNull(account),
                    "[승인]" + serviceName+ "의 구독 신청이 승인되었습니다.",
                    "[Approve]" + serviceName+ " subscription approved",
                    "[Approve]" + serviceName+ " subscription approved",
                    NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
                    "API G/W 에 반영되는데 1~2분 가량 소요됩니다.",
                    "API G/W Adapted 1~2 minutes later",
                    "API G/W Adapted 1~2 minutes later",
                    url,
                    userList
            );

        }
    }

    /**
     * 구독 해제
     *
     * @param hcpApiSubList
     * @param empNo
     */
    @Transactional
    public void unsubscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();
        Set<Long> svcIds = new HashSet<>();

        int updateCnt = 0;
        for (HcpApiSub it : hcpApiSubList) {
            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("NOR");

            Long keyId = it.getKeyId();
            Long svcId = it.getSvcId();
            svcIds.add(svcId);
            String svcType = svcTypeCacheMap.computeIfAbsent(svcId, k -> hcpApiSvcMapper.getHcpSvcType(svcId));
            if ("CTS".equalsIgnoreCase(svcType)) {
                CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

                if (keyInfo == null) {
                    log.error("keyInfo is null - keyId : {}", keyId);
                    throw new RestException(ResponseCode.BAD_REQUEST, "keyInfo is null");
                }

                // 2. CTS구독 프로세스
                try {
                    ctsService.unSubscriptionCts(keyInfo);
                } catch (Exception e) {
                    log.error("cts subscription error! - {}", e.getMessage());
                    throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "cts subscription fail");
                }
            }

            if("DRM".equalsIgnoreCase(svcType)) {
                removeSysEmpNoMapping(it);
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if( updateCnt == 0){
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 해제된 API가 없습니다. 잘못된 요청입니다.");
        }
        hcpApiQosService.deleteApiQosByPubIdAndKeyId(hcpApiSubList);

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "CCL", empNo, "구독 신청이 해제되었습니다");
        }
    }

    /**
     * 구독 승인 반려
     *
     * @param hcpApiSubList
     * @param empNo
     * @param account
     * @throws Exception
     */
    public void reject(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();
        Set<Long> svcIds = new HashSet<>();
        int updateCnt = 0;
        for (HcpApiSub it : hcpApiSubList) {
            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("APR");

            Long svcId = it.getSvcId();
            String svcType = svcTypeCacheMap.computeIfAbsent(svcId, k -> hcpApiSvcMapper.getHcpSvcType(svcId));

            if ("DRM".equalsIgnoreCase(svcType)) {
                HcpApiKeySys sysEmpNoMapping = hcpApiKeySysMapper.findSysEmpNoMapping(
                        it.getSvcId(),
                        it.getKeyId(),
                        env.toUpperCase()
                );
                if (sysEmpNoMapping != null) {
                // HCP_API_KEY_SYS 삭제
                    hcpApiKeySysMapper.deleteSysEmpNo(
                            HcpApiKeySys.builder()
                                    .svcId(it.getSvcId())
                                    .keyId(it.getKeyId())
                                    .sysEmpNo(sysEmpNoMapping.getSysEmpNo())
                                    .svcEnv(env.toUpperCase())
                                    .build()
                    );
                }

            }
            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;

            svcIds.add(it.getSvcId());
        }

        if (updateCnt == 0) {
            throw new RestException(ResponseCode.BAD_REQUEST, "반려된 API가 없습니다. 잘못된 요청입니다.");
        }


        String actCd = "SEJ";
        String memo = "구독 신청이 반려되었습니다";
        String reason = hcpApiSubList.get(0).getAprvReason();
        for (Long svcId : svcIds) {

            commonService.actionHistory(svcId, actCd, empNo, memo);

            Map<String, Object> hashMap = Map.of("svcId", svcId, "keyId", hcpApiSubList.get(0).getKeyId(), "empNo", empNo);
            List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
            List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);

            String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");
            Map<String, Object> templateHashMap = new HashMap<>();
            templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
            templateHashMap.put("message", serviceName + "의 구독 신청이 반려되었습니다.");
            templateHashMap.put("message1", "반려메시지 : " + reason);

            String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;
            for (int i = 0; i < 2; i++) {
                templateHashMap.put("urlLink", url);
                if (i == 0) {
                    templateHashMap.put("userId", "");
                    String channelId = cubeChannelId;
                    templateHashMap.put("channelId", channelId);
                } else if (i == 1) {
                    templateHashMap.put("userId", userList.get(0));
                    templateHashMap.put("channelId", "");
                }
                myPageService.notificate(templateHashMap);
            }
            commonService.workplaceNotify(
                    accountUtil.getSiteIdDefaultIfNull(account),
                    "[반려]" + serviceName + "의 구독 신청이 반려되었습니다.",
                    "[Reject]" + serviceName + " subscription rejected",
                    "[Reject]" + serviceName + " subscription rejected",
                    NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
                    "rejectMessage  : " + reason,
                    "rejectMessage  : " + reason,
                    "rejectMessage  : " + reason,
                    url,
                    userList
            );
        }
    }

    public int selectSubAprCount(List<HcpApiSub> hcpApiSvcSubList) {
        long keyId = hcpApiSvcSubList.get(0).getKeyId();
        Set<Long> pubIds = hcpApiSvcSubList.stream().map(HcpApiSub::getPubId).collect(Collectors.toSet());

        return hcpApiSubMapper.selectCountByKeyIdAndPubIds(keyId, pubIds);
    }

    /*
    DRM 서비스 키 매핑
     */
    private void mergeSysEmpNoMapping(HcpApiSub sub){
        HcpApiKeySys param = HcpApiKeySys.builder()
                .svcId(sub.getSvcId())
                .keyId(sub.getKeyId())
                .sysEmpNo(sub.getSysEmpNo())
                .svcEnv(env.toUpperCase())
                .build();
        try {
            int affected = hcpApiKeySysMapper.mergeSysEmpNo(param);
            if (affected <= 0) {
                throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 저장에 실패했습니다.");
            }
        } catch (DuplicateKeyException e) {
            log.warn("중복 시스템 사번 매핑. svcId={}, keyId={}, sysEmpNo={}",
                    sub.getSvcId(), sub.getKeyId(), sub.getSysEmpNo());
            throw new RestException(CONFLICT, "이미 등록된 시스템 사번입니다.");
        } catch (DataAccessException e) {
            log.error("시스템 사번 매핑 DB 오류. svcId={}, keyId={}, sysEmpNo={}",
                    sub.getSvcId(), sub.getKeyId(), sub.getSysEmpNo(), e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 처리 중 DB 오류가 발생했습니다.");
        }
    }

    private void removeSysEmpNoMapping(HcpApiSub sub){
        if (sub == null || sub.getSvcId() == null || sub.getKeyId() == null || sub.getSysEmpNo() == null) {
            throw new RestException(BAD_REQUEST, "시스템 사번 매핑 삭제 대상이 올바르지 않습니다.");
        }

        try {
            // I/F 테이블 키 정보 초기화
            resetIfApiKey(sub.getSysEmpNo());

            // HCP_API_KEY_SYS 삭제
            hcpApiKeySysMapper.deleteSysEmpNo(
                    HcpApiKeySys.builder()
                            .svcId(sub.getSvcId())
                            .keyId(sub.getKeyId())
                            .sysEmpNo(sub.getSysEmpNo())
                            .svcEnv(env.toUpperCase())
                    .build()
            );
        } catch (DataAccessException e) {
            log.error("시스템 사번 매핑 삭제 실패. svcId={}, keyId={}", sub.getSvcId(), sub.getKeyId(), e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 삭제 중 DB 오류가 발생했습니다.");
        }
    }

    private void confirmDrmSubscription(HcpApiSub sub) {
        validateDrmApprovalTarget(sub);

        HcpApiKeySys mapping = hcpApiKeySysMapper.findSysEmpNoMapping(
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

    private void updateIfApiKey(HcpApiKeySys hcpApiKeysys){
        if ("STG".equalsIgnoreCase(env)) {
            idmUsrTblMapper.updateIFApiKeyFromStg(hcpApiKeysys);
        } else {
            idmUsrTblMapper.updateIFApiKey(hcpApiKeysys);
        }
    }

    private void resetIfApiKey(String sysEmpNo) {
        if ("STG".equalsIgnoreCase(env)) {
            idmUsrTblMapper.deleteIFApiKeyFromStg(sysEmpNo);
        } else {
            idmUsrTblMapper.deleteIFApiKey(sysEmpNo);
        }
    }

    private void validateDrmSubscriptionTarget(HcpApiSub sub) {
        if (sub == null) {
            throw new RestException(BAD_REQUEST, "구독 정보가 없습니다.");
        }

        if (sub.getSvcId() == null || sub.getSvcId() <= 0) {
            throw new RestException(BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
        }

        if (sub.getKeyId() == null || sub.getKeyId() <= 0) {
            throw new RestException(BAD_REQUEST, "키 ID가 유효하지 않습니다.");
        }

        if (StringUtils.isBlank(sub.getSysEmpNo())) {
            throw new RestException(BAD_REQUEST, "시스템 사번이 비어 있습니다.");
        }

        HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(sub.getKeyId());
        if (key == null) {
            throw new RestException(NOT_FOUND, "존재하지 않는 키입니다.");
        }

        if (!"PSN".equalsIgnoreCase(key.getAuthCd())) {
            throw new RestException(BAD_REQUEST, "개인 타입 키만 구독 신청할 수 있습니다.");
        }
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

        if (!"PSN".equalsIgnoreCase(key.getAuthCd())) {
            throw new RestException(ResponseCode.BAD_REQUEST, "개인 타입 키만 DRM 승인 처리할 수 있습니다.");
        }
    }
