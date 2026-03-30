알림보내는 부부만 추출해서 리펙토링하려고하는데 잘했는지 봐줘


    /**
     * 구독 신청
     * @param hcpApiSubList
     * @param account
     */
    public void subscribe(List<HcpApiSub> hcpApiSubList, Account account) throws Exception{
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();
        Set<Long> svcIds = new HashSet<>();
        String loginEmpNo = account.getAccountId();
        Set<HcpApiKeySys> hcpApiKeySysSet = new HashSet<>();

        hcpApiSubList.forEach(it -> {
            svcIds.add(it.getSvcId());

            it.setEmpNo(loginEmpNo);

            long svcId = it.getSvcId();
            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if("DRM".equalsIgnoreCase(svcType)){
                String resultStatus = hcpApiSysEmpNoService.verifySysEmpNo(it.getKeyId(), it.getSysEmpNo());
                if(!resultStatus.equals("VALID")){
                    throw new RestException(BAD_REQUEST, resultStatus);
                }
                hcpApiKeySysSet.add(HcpApiKeySys.builder()
                        .svcId(it.getSvcId())
                        .keyId(it.getKeyId())
                        .sysEmpNo(it.getSysEmpNo())
                        .build());
            }

            hcpApiSubMapper.mergeApiSub(it);
        });

        for (HcpApiKeySys target : hcpApiKeySysSet) {
            mergeSysEmpNoMapping(target);
        }

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "SRE", loginEmpNo, "구독 신청이 완료되었습니다.");

            String url = linkUrl + "apps/hcp-web-api-store/api/detail/"+svcId;
            List<String> mngList =  getManagerList(svcId);
            if( CollectionUtils.isEmpty(mngList )){
                continue;
            }

            List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);
            String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");

            Map<String, Object> templateHashMap = new HashMap<>();
            templateHashMap.put("title", "**API Store 구독 신청 알림**");
            templateHashMap.put("message", serviceName + "의 구독이 신청되었습니다");

            String userNm = account.getAccountName() + " ("+ loginEmpNo +")";

            templateHashMap.put("user_id", mngList.toArray(new String[0]));
            templateHashMap.put("svcNm", serviceName);
            templateHashMap.put("userNm",  userNm);
            templateHashMap.put("urlLink", url);
            LocalDateTime dateTime = LocalDateTime.now();
            templateHashMap.put("regDate", dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) );
            templateHashMap.put("channelId", cubeChannelId);

            cubeNotiService.notificate(TEMPLATE_SUBSCRIBE_PATH, templateHashMap);

            templateHashMap.put("channelId", "");
            cubeNotiService.notificate(TEMPLATE_SUBSCRIBE_PATH, templateHashMap);
        }
    }

    private List<String> getManagerList(Long svcId) {
        List<HcpApiSvcMng> data = apiSvcMngMapper.getManagerEmpNoList(svcId);
        if( CollectionUtils.isEmpty(data)){
            return new ArrayList<>();
        }
        return data.stream().map(HcpApiSvcMng::getEmpNo).collect(Collectors.toList());
    }


    /**
     * 구독 승인
     *
     * @param hcpApiSubList
     * @param empNo
     * @param account
     * @throws Exception
     */
    public void confirm(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
        Set<Long> svcIds = new HashSet<>();
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();

        Set<HcpApiKeySys> hcpApiKeySysSet = new HashSet<>();

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
                hcpApiKeySysSet.add(buildDrmConfirmTarget(it));
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if( updateCnt == 0){
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인된 API가 없습니다. 잘못된 요청입니다.");
        }

        for (HcpApiKeySys target : hcpApiKeySysSet) {
            updateIfApiKey(target);
        }

        hcpApiQosService.registApiQosWithDefaultBySub(hcpApiSubList);

        String actCd = "SPR";
        String memo = "구독 신청이 승인되었습니다";
        for (Long svcId : svcIds) {
                commonService.actionHistory(svcId, actCd, empNo, memo);

                String url = linkUrl + "apps/hcp-web-api-store/api/detail/"+svcId;
                Map<String, Object> hashMap = Map.of( "svcId", svcId, "keyId", hcpApiSubList.get(0).getKeyId(), "empNo", empNo);
                List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
                if( CollectionUtils.isEmpty( userList) ){
                    continue;
                }

                List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);
                String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");

                Map<String, Object> templateHashMap = new HashMap<>();
                templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
                templateHashMap.put("message", serviceName + "의 구독 신청이 승인되었습니다.");
                templateHashMap.put("message1", "API G/W 에 반영되는데 1~2분 가량 소요됩니다.");
                templateHashMap.put("urlLink", url);
                templateHashMap.put("userId", userList.get(0));
                templateHashMap.put("channelId", cubeChannelId);
                cubeNotiService.notificate(templateHashMap);

                templateHashMap.put("channelId", "");
                cubeNotiService.notificate(templateHashMap);

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
    public void unsubscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();
        Set<Long> svcIds = new HashSet<>();

        Set<HcpApiKeySys> hcpApiKeySysSet = new HashSet<>();

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
                hcpApiKeySysSet.add(buildDrmConfirmTarget(it));
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if( updateCnt == 0){
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 해제된 API가 없습니다. 잘못된 요청입니다.");
        }

        for (HcpApiKeySys target : hcpApiKeySysSet) {
            removeSysEmpNoMapping(target);
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
        Set<HcpApiKeySys> hcpApiKeySysSet = new HashSet<>();

        int updateCnt = 0;
        for (HcpApiSub it : hcpApiSubList) {
            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("APR");

            Long svcId = it.getSvcId();
            String svcType = svcTypeCacheMap.computeIfAbsent(svcId, k -> hcpApiSvcMapper.getHcpSvcType(svcId));

            if ("DRM".equalsIgnoreCase(svcType)) {
                hcpApiKeySysSet.add(buildDrmConfirmTarget(it));
            }
            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;

            svcIds.add(it.getSvcId());
        }

        if (updateCnt == 0) {
            throw new RestException(ResponseCode.BAD_REQUEST, "반려된 API가 없습니다. 잘못된 요청입니다.");
        }

        for (HcpApiKeySys target : hcpApiKeySysSet) {
            removeSysEmpNoMapping(target);
        }
        String actCd = "SEJ";
        String memo = "구독 신청이 반려되었습니다";
        String reason = hcpApiSubList.get(0).getAprvReason();
        for (Long svcId : svcIds) {

            commonService.actionHistory(svcId, actCd, empNo, memo);
            Map<String, Object> resultMap = commonService.notifyCubeMsg(svcId, hcpApiSubList.get(0).getKeyId(), empNo, "**API Store 구독 신청 결과 알림**",
                    new String[]{"의 구독 신청이 반려되었습니다.", reason});

//            Map<String, Object> hashMap = Map.of("svcId", svcId, "keyId", hcpApiSubList.get(0).getKeyId(), "empNo", empNo);
//            List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
//            if( CollectionUtils.isEmpty( userList) ){
//                continue;
//            }
//
//            List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);
//
//            String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");
//            Map<String, Object> templateHashMap = new HashMap<>();
//            templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
//            templateHashMap.put("message", serviceName + "의 구독 신청이 반려되었습니다.");
//            templateHashMap.put("message1", "반려메시지 : " + reason);
//
//            String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;
//            for (int i = 0; i < 2; i++) {
//                templateHashMap.put("urlLink", url);
//                if (i == 0) {
//                    templateHashMap.put("userId", "");
//                    String channelId = cubeChannelId;
//                    templateHashMap.put("channelId", channelId);
//                } else if (i == 1) {
//                    templateHashMap.put("userId", userList.get(0));
//                    templateHashMap.put("channelId", "");
//                }
//                cubeNotiService.notificate(templateHashMap);
//            }
            if(CollectionUtils.isEmpty((Collection<?>) resultMap)){
                commonService.workplaceNotify(
                        accountUtil.getSiteIdDefaultIfNull(account),
                        "[반려]" + resultMap.get("serviceName") + "의 구독 신청이 반려되었습니다.",
                        "[Reject]" + resultMap.get("serviceName") + " subscription rejected",
                        "[Reject]" + resultMap.get("serviceName") + " subscription rejected",
                        NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
                        "rejectMessage  : " + reason,
                        "rejectMessage  : " + reason,
                        "rejectMessage  : " + reason,
                        (String) resultMap.get("url"),
                        (List<String>) resultMap.get("userList")
                );
            }

        }
    }

추춘 메소드

public Map<String, Object> notifyCubeMsg(Long svcId, Long keyId, String empNo, String title, String[] msgArr) throws Exception {
		Map<String, Object> resultMap = new HashMap<>();
		Map<String, Object> hashMap = Map.of("svcId", svcId, "keyId", keyId, "empNo", empNo);
		List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
		if (CollectionUtils.isEmpty(userList)) {
			return null;
		}
		resultMap.put("userList", userList);


		List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);

		String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");
		resultMap.put("serviceName", serviceName);
		Map<String, Object> templateHashMap = new HashMap<>();
		templateHashMap.put("title", title);
		templateHashMap.put("message", serviceName + msgArr[0]);
		if(msgArr.length > 1){
			templateHashMap.put("message1", "반려메시지 : " + msgArr[1]);
		}

		String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;
		resultMap.put("url", url);
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
			cubeNotiService.notificate(templateHashMap);
		}
		return resultMap;
	}



