이거 실무 로직으로 어때?CLOB에 s넣는거야 리펙토링해줘
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
            Set<Long> keyIdSet = hcpApiSubList.stream()
                    .filter(item -> Objects.equals(item.getSvcId(), svcId))
                    .map(HcpApiSub::getKeyId)
                    .collect(Collectors.toSet());
            List<HistoryDetailDTO> keyList = apiKeyMapper.getKeyNameById(keyIdSet);
            Map<String, Object> detailMap = Map.of("keyList", keyList);

            commonService.actionHistory(svcId, actCd, empNo, memo, detailMap);
            apiNotificationService.subscribeConfirmNoti(hcpApiSubList.get(0).getKeyId(), account, svcId);
        }
    }
public void actionHistory(Long svcId, String actCd, String empNo, String memo, Map<String,Object> detailMap) throws JsonProcessingException {
		HcpApiSvcActHist action = new HcpApiSvcActHist();
		action.setSvcId(svcId);
		action.setActCd(actCd);
		action.setEmpNo(empNo);
		action.setMemo(memo);

		ObjectMapper mapper = new ObjectMapper();
		action.setDetail(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(detailMap));

		hcpApiSvcActHistMapper.insertApiSvcActHistDetail(action);
	}


@Data
public class HistoryDetailDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long keyId;

    private String keyName;


}

