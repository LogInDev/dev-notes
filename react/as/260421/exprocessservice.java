import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpiryProcessService {

    private final HcpApiQosMapper hcpApiQosMapper;
    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;
    private final ObjectMapper objectMapper;

    public void insertActionHistory(List<HcpApiInfo> apiInfos, String memo) {
        if (CollectionUtils.isEmpty(apiInfos)) {
            return;
        }

        Map<Long, List<HcpApiInfo>> groupedBySvcId = apiInfos.stream()
                .filter(apiInfo -> apiInfo.getSvcId() != null)
                .collect(Collectors.groupingBy(HcpApiInfo::getSvcId));

        List<HcpApiSvcActHist> histories = new ArrayList<>();

        for (Map.Entry<Long, List<HcpApiInfo>> entry : groupedBySvcId.entrySet()) {
            Long svcId = entry.getKey();
            List<HcpApiInfo> svcApiInfos = entry.getValue();

            String actCd = svcApiInfos.stream()
                    .map(HcpApiInfo::getHistStatCd)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (actCd == null) {
                log.warn("액션 이력 저장 스킵 - histStatCd 없음. svcId={}", svcId);
                continue;
            }

            List<KeyDetailInfoDTO> keyDetails = svcApiInfos.stream()
                    .filter(item -> item.getKeyId() != null)
                    .map(item -> KeyDetailInfoDTO.builder()
                            .keyId(item.getKeyId())
                            .keyName(item.getKeyName())
                            .build())
                    .distinct()
                    .collect(Collectors.toList());

            String detailJson = toDetailJson(keyDetails);

            HcpApiSvcActHist history = HcpApiSvcActHist.builder()
                    .svcId(svcId)
                    .actCd(actCd)
                    .memo(memo)
                    .detail(detailJson)
                    .build();

            histories.add(history);
        }

        if (CollectionUtils.isEmpty(histories)) {
            log.warn("구독 관련 이력 저장 대상이 없습니다.");
            return;
        }

        int insertCnt = hcpApiSvcActHistMapper.insertApiSvcActHist(histories);
        log.info("구독 관련 이력 저장 완료. requestedCount={}, insertedCount={}", histories.size(), insertCnt);

        if (insertCnt != histories.size()) {
            log.warn("구독 관련 이력 데이터 반영을 완료하지 못했습니다. expected={}, actual={}", histories.size(), insertCnt);
        }
    }

    private String toDetailJson(List<KeyDetailInfoDTO> keyDetails) {
        Map<String, Object> detailMap = new HashMap<>();
        detailMap.put("keyList", keyDetails);

        try {
            return objectMapper.writeValueAsString(detailMap);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("공통 이력 detail JSON 변환 실패", e);
        }
    }
}