@Service
@RequiredArgsConstructor
public class CommonService {

    private final ObjectMapper objectMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;
    private final ApiKeyMapper apiKeyMapper;

    public void actionHistory(Long svcId,
                              String actCd,
                              String empNo,
                              String memo,
                              ApiActionHistoryDetail detail) {
        try {
            HcpApiSvcActHist action = new HcpApiSvcActHist();
            action.setSvcId(svcId);
            action.setActCd(actCd);
            action.setEmpNo(empNo);
            action.setMemo(memo);
            action.setDetail(objectMapper.writeValueAsString(detail));

            hcpApiSvcActHistMapper.insertApiSvcActHistDetail(action);
        } catch (JsonProcessingException e) {
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "이력 상세 정보 직렬화에 실패했습니다.");
        }
    }

    public void recordSubscriptionApproveHistory(Long svcId,
                                                 String empNo,
                                                 Set<Long> keyIdSet) {
        List<HistoryDetailDTO> keyList = apiKeyMapper.getKeyNameById(keyIdSet);

        ApiActionHistoryDetail detail = ApiActionHistoryDetail.builder()
                .keyList(keyList)
                .build();

        actionHistory(svcId, "SPR", empNo, "구독 신청이 승인되었습니다", detail);
    }
}

commonService.recordSubscriptionApproveHistory(svcId, empNo, keyIdSet);
Map<Long, List<HcpApiSub>> subMapBySvcId = hcpApiSubList.stream()
        .collect(Collectors.groupingBy(HcpApiSub::getSvcId));

for (Map.Entry<Long, List<HcpApiSub>> entry : subMapBySvcId.entrySet()) {
    Long svcId = entry.getKey();
    List<HcpApiSub> subs = entry.getValue();

    Set<Long> keyIdSet = subs.stream()
            .map(HcpApiSub::getKeyId)
            .collect(Collectors.toSet());

    commonService.recordSubscriptionApproveHistory(svcId, empNo, keyIdSet);

    Long keyId = subs.stream()
            .map(HcpApiSub::getKeyId)
            .findFirst()
            .orElse(null);

    if (keyId != null) {
        apiNotificationService.subscribeConfirmNoti(keyId, account, svcId);
    }
}
