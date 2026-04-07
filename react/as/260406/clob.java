@Service
@RequiredArgsConstructor
public class HistoryService {

    private final HistMapper histMapper;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getActHist(Long svcId) {
        Map<String, Object> params = new HashMap<>();
        params.put("svcId", svcId);

        int count = histMapper.getActHistCount(params);
        List<Map<String, Object>> actHist = histMapper.getActHistDetail(params);

        actHist.forEach(this::replaceDetailWithKeyNames);

        params.put("actHist", actHist);
        params.put("total", count);
        return params;
    }

    private void replaceDetailWithKeyNames(Map<String, Object> item) {
        Object detailObj = item.get("detail");
        if (detailObj == null) {
            return;
        }

        try {
            ApiActionHistoryDetail detail = objectMapper.readValue(
                    detailObj.toString(),
                    ApiActionHistoryDetail.class
            );

            String keyNames = Optional.ofNullable(detail.getKeyList())
                    .orElse(Collections.emptyList())
                    .stream()
                    .map(HistoryDetailDTO::getKeyName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(" | "));

            item.put("detail", keyNames);
        } catch (IOException e) {
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "이력 상세 정보 파싱에 실패했습니다.");
        }
    }
}


@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class HcpApiSubscriptionService {

    private final HcpApiSvcMapper hcpApiSvcMapper;
    private final HcpApiTokenMapper hcpApiTokenMapper;
    private final HcpApiSubMapper hcpApiSubMapper;
    private final HcpApiQosService hcpApiQosService;
    private final ApiKeyMapper apiKeyMapper;
    private final ApiNotificationService apiNotificationService;
    private final CommonService commonService;
    private final CtsService ctsService;

    public void confirm(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
        if (hcpApiSubList == null || hcpApiSubList.isEmpty()) {
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인 대상이 없습니다.");
        }

        Map<Long, String> svcTypeCacheMap = new HashMap<>();
        Set<HcpApiKeySys> drmConfirmTargets = new HashSet<>();
        Set<Long> approvedSvcIds = new HashSet<>();

        int updateCnt = 0;

        for (HcpApiSub sub : hcpApiSubList) {
            prepareConfirmTarget(sub, empNo);

            Long svcId = sub.getSvcId();
            String svcType = getSvcType(svcId, svcTypeCacheMap);

            handleSubscriptionBySvcType(sub, svcType, drmConfirmTargets);

            updateCnt += hcpApiSubMapper.updateApiSub(sub);
            approvedSvcIds.add(svcId);
        }

        validateUpdatedCount(updateCnt);

        applyDrmConfirmTargets(drmConfirmTargets);

        hcpApiQosService.registApiQosWithDefaultBySub(hcpApiSubList);

        saveConfirmHistories(hcpApiSubList, empNo);

        sendConfirmNotifications(approvedSvcIds, hcpApiSubList, account);
    }

    private void prepareConfirmTarget(HcpApiSub sub, String empNo) {
        sub.setEmpNo(empNo);
        sub.setBeforeSubStatCd("APR");
    }

    private String getSvcType(Long svcId, Map<Long, String> svcTypeCacheMap) {
        return svcTypeCacheMap.computeIfAbsent(svcId, hcpApiSvcMapper::getHcpSvcType);
    }

    private void handleSubscriptionBySvcType(HcpApiSub sub,
                                             String svcType,
                                             Set<HcpApiKeySys> drmConfirmTargets) {
        if ("CTS".equalsIgnoreCase(svcType)) {
            processCtsConfirm(sub);
            return;
        }

        if ("DRM".equalsIgnoreCase(svcType)) {
            drmConfirmTargets.add(buildDrmConfirmTarget(sub));
        }
    }

    private void processCtsConfirm(HcpApiSub sub) {
        Long keyId = sub.getKeyId();
        CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

        if (keyInfo == null) {
            log.error("CTS keyInfo is null. keyId={}", keyId);
            throw new RestException(ResponseCode.BAD_REQUEST, "CTS 키 정보를 찾을 수 없습니다.");
        }

        try {
            boolean alreadySubscribed = ctsService.checkAlreadySubscription(keyId);
            if (!alreadySubscribed) {
                ctsService.subscriptionCts(keyInfo);
            } else {
                log.info("already subscribed cts. keyId={}", keyId);
            }
        } catch (Exception e) {
            log.error("CTS subscription error. keyId={}, message={}", keyId, e.getMessage(), e);
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "CTS 구독 처리에 실패했습니다.");
        }
    }

    private void validateUpdatedCount(int updateCnt) {
        if (updateCnt == 0) {
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인된 API가 없습니다. 잘못된 요청입니다.");
        }
    }

    private void applyDrmConfirmTargets(Set<HcpApiKeySys> drmConfirmTargets) {
        for (HcpApiKeySys target : drmConfirmTargets) {
            updateIfApiKey(target);
        }
    }

    private void saveConfirmHistories(List<HcpApiSub> hcpApiSubList, String empNo) {
        String actCd = "SPR";
        String memo = "구독 신청이 승인되었습니다";

        Map<Long, List<HcpApiSub>> subMapBySvcId = hcpApiSubList.stream()
                .collect(Collectors.groupingBy(HcpApiSub::getSvcId));

        for (Map.Entry<Long, List<HcpApiSub>> entry : subMapBySvcId.entrySet()) {
            Long svcId = entry.getKey();
            List<HcpApiSub> subs = entry.getValue();

            Set<Long> keyIdSet = subs.stream()
                    .map(HcpApiSub::getKeyId)
                    .collect(Collectors.toSet());

            List<HistoryDetailDTO> keyList = apiKeyMapper.getKeyNameById(keyIdSet);

            ApiActionHistoryDetail detail = ApiActionHistoryDetail.builder()
                    .keyList(keyList)
                    .build();

            commonService.actionHistory(svcId, actCd, empNo, memo, detail);
        }
    }

    private void sendConfirmNotifications(Set<Long> svcIds,
                                          List<HcpApiSub> hcpApiSubList,
                                          Account account) {
        for (Long svcId : svcIds) {
            Long keyId = hcpApiSubList.stream()
                    .filter(sub -> Objects.equals(sub.getSvcId(), svcId))
                    .map(HcpApiSub::getKeyId)
                    .findFirst()
                    .orElse(null);

            if (keyId != null) {
                apiNotificationService.subscribeConfirmNoti(keyId, account, svcId);
            }
        }
    }

    private HcpApiKeySys buildDrmConfirmTarget(HcpApiSub sub) {
        // 기존 로직 사용
        return new HcpApiKeySys();
    }

    private void updateIfApiKey(HcpApiKeySys target) {
        // 기존 로직 사용
    }
}