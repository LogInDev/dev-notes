
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

        historyNotiProcess(hcpApiSubList, account, 1);
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

        historyNotiProcess(hcpApiSubList, account, 2);
    }

    /**
     * 구독 해제
     *
     * @param hcpApiSubList
     * @param empNo
     */
    public void unsubscribe(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
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

        historyNotiProcess(hcpApiSubList, account, 4);
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

        historyNotiProcess(hcpApiSubList, account, 3);
    }

    /**
     * 구독 처리 로직 타입별로 이력남기기 및 알림 전송 프로세스
     *
     * @param hcpApiSubList 구독 관련 정보 리스트
     * @param account       로그인된 유저 정보
     * @param subType       1: 구독 신청 || 2: 구독 승인 || 3: 구독 신청 반려 || 4: 구독 해제
     * @throws JsonProcessingException
     */
    private void historyNotiProcess(List<HcpApiSub> hcpApiSubList, Account account, int subType) throws JsonProcessingException {
        String empNo = account.getAccountId();
        Map<Long, List<HcpApiSub>> keyMapBySvcId = hcpApiSubList.stream()
                .collect(Collectors.groupingBy(HcpApiSub::getSvcId));
        String reason = hcpApiSubList.get(0).getAprvReason();

        for (Map.Entry<Long, List<HcpApiSub>> entry : keyMapBySvcId.entrySet()) {
            Long svcId = entry.getKey();
            List<HcpApiSub> subs = entry.getValue();

            Set<Long> keyIdSet = subs.stream()
                    .map(HcpApiSub::getKeyId)
                    .collect(Collectors.toSet());

            ApiActionHistoryDetail detailInfo = getKeyDetailInfo(keyIdSet);

            if(subType == 1){
                commonService.actionHistory(svcId, "SRE", empNo, "구독 신청이 완료되었습니다.", detailInfo);
                apiNotificationService.subscribeNoti(account, svcId);
                return;
            }

            Long keyId = subs.stream()
                    .map(HcpApiSub::getKeyId)
                    .findFirst()
                    .orElse(null);

            if(subType == 2){
                commonService.actionHistory(svcId, "SPR", empNo, "구독 신청이 승인되었습니다.", detailInfo);

                if (keyId != null) {
                    apiNotificationService.subscribeConfirmNoti(keyId, account, svcId);
                }
                return;
            }

            if(subType == 3){
                commonService.actionHistory(svcId, "SEJ", empNo, "구독 신청이 반려되었습니다.", detailInfo);

                if (keyId != null) {
                    apiNotificationService.subscribeRejectNoti(keyId, account, svcId, reason);
                }
                return;
            }

            if(subType == 4){
                commonService.actionHistory(svcId, "CCL", empNo, "구독 신청이 해제되었습니다.", detailInfo);

                if (keyId != null) {
                    apiNotificationService.unsubscribeNoti(keyId, account, svcId);
                }
            }
        }
    }
