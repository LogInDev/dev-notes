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
            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        // DRM 서비스 타입 구독 시 시스템 사번 매핑
        HcpApiSub hcpApiSub = hcpApiSubList.get(0);
        String svcType = hcpApiSvcMapper.getHcpSvcType(hcpApiSub.getSvcId());
        if("DRM".equalsIgnoreCase(svcType)) {
            HcpApiKeySys sysEmpNo = hcpApiSvcMapper.getSysEmpNo(hcpApiSub.getSvcId(), hcpApiSub.getKeyId());
            hcpApiSub.setSysEmpNo(sysEmpNo.getSysEmpNo());
            validateDrmSubscriptionTarget(hcpApiSub);
            updateIfApiKey(HcpApiKeySys.builder()
                    .svcId(hcpApiSub.getSvcId())
                    .keyId(hcpApiSub.getKeyId())
                    .sysEmpNo(hcpApiSub.getSysEmpNo())
                    .svcEnv(env.toUpperCase())
                    .build());
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

    private void updateIfApiKey(HcpApiKeySys hcpApiKeysys){
        if ("STG".equalsIgnoreCase(env)) {
            hcpApiSvcMapper.updateIFApiKeyFromStg(hcpApiKeysys);
        } else {
            hcpApiSvcMapper.updateIFApiKey(hcpApiKeysys);
        }
    }


  <update id="updateIFApiKeyFromStg" parameterType="com.skhynix.hcp.svc.api.store.vo.HcpApiKeySys">
        UPDATE IDM_USR_TBL_STG
        SET
            KEY_ID =  #{keyId},
            API_STORE_KEY = (SELECT KEY_PUB FROM HCP_API_KEY hak
                                                      INNER JOIN HCP_API_KEY_AUTH haka
                                                                 ON hak.KEY_ID = haka.KEY_ID
                              WHERE
                                  hak.KEY_ID = #{keyId}
                                AND
                                  hak.SVC_ENV = '${hcp.application.env}')
        WHERE ACCOUNT = #{sysEmpNo}
    </update>

    <update id="updateIFApiKey" parameterType="com.skhynix.hcp.svc.api.store.vo.HcpApiKeySys">
        UPDATE IDM_USR_TBL
        SET
            KEY_ID =  #{keyId},
            API_STORE_KEY = (SELECT KEY_PUB FROM HCP_API_KEY hak
                                                     INNER JOIN HCP_API_KEY_AUTH haka
                                                                ON hak.KEY_ID = haka.KEY_ID
                             WHERE
                                 hak.KEY_ID = #{keyId}
                               AND
                                 hak.SVC_ENV = '${hcp.application.env}')
        WHERE ACCOUNT = #{sysEmpNo}
    </update>
