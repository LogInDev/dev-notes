프론트가 상태를 추론하지 않게, 조회 API에서 아래처럼 내려주는 걸 추천해.

ApiDetail 응답 예시
{
  "keyId": 101,
  "keyName": "sample-key",
  "authCd": "SYS",
  "subscriptionStatus": "APR",
  "systemEmpNoSection": {
    "visible": true,
    "editable": false,
    "value": "20240001",
    "validationRequired": false,
    "subscriptionRequestEnabled": false,
    "message": "승인 대기 중인 시스템 사번입니다."
  }
}
상태별 응답 규칙
1) SYS + NOR
{
  "authCd": "SYS",
  "subscriptionStatus": "NOR",
  "systemEmpNoSection": {
    "visible": true,
    "editable": false,
    "value": "20240001",
    "validationRequired": false,
    "subscriptionRequestEnabled": false,
    "message": "구독 완료된 시스템 사번입니다."
  }
}
2) SYS + APR
{
  "authCd": "SYS",
  "subscriptionStatus": "APR",
  "systemEmpNoSection": {
    "visible": true,
    "editable": false,
    "value": "20240001",
    "validationRequired": false,
    "subscriptionRequestEnabled": false,
    "message": "승인 대기 중인 시스템 사번입니다."
  }
}
3) SYS + 미신청
{
  "authCd": "SYS",
  "subscriptionStatus": null,
  "systemEmpNoSection": {
    "visible": true,
    "editable": true,
    "value": null,
    "validationRequired": true,
    "subscriptionRequestEnabled": false,
    "message": "시스템 사번 유효성 검사 후 구독 신청이 가능합니다."
  }
}
4) SYS 아님
{
  "authCd": "ROOT",
  "subscriptionStatus": null,
  "systemEmpNoSection": {
    "visible": false,
    "editable": false,
    "value": null,
    "validationRequired": false,
    "subscriptionRequestEnabled": false,
    "message": null
  }
}
2. 백엔드 DTO 예시
ApiDetailResponse.java
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiDetailResponse {
    private Long keyId;
    private String keyName;
    private String authCd;
    private String subscriptionStatus;
    private SystemEmpNoSectionResponse systemEmpNoSection;
}
SystemEmpNoSectionResponse.java
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SystemEmpNoSectionResponse {
    private boolean visible;
    private boolean editable;
    private String value;
    private boolean validationRequired;
    private boolean subscriptionRequestEnabled;
    private String message;
}
3. ApiDetail 조회 서비스 로직 예시

이게 제일 중요해.
조회 시점에 프론트가 그대로 그릴 수 있게 상태를 정리해서 내려주는 방식이야.

public ApiDetailResponse getApiDetail(Long keyId) {
    ApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Key 입니다."));

    String authCd = apiKey.getAuthCd();

    ApiSubscription subscription = apiSubscriptionRepository.findLatestByKeyId(keyId).orElse(null);
    ApiKeySysEmpMap sysEmpMap = apiKeySysEmpMapRepository.findByKeyId(keyId).orElse(null);

    SystemEmpNoSectionResponse systemEmpNoSection;

    if (!"SYS".equals(authCd)) {
        systemEmpNoSection = SystemEmpNoSectionResponse.builder()
                .visible(false)
                .editable(false)
                .value(null)
                .validationRequired(false)
                .subscriptionRequestEnabled(false)
                .message(null)
                .build();
    } else if (subscription != null && "NOR".equals(subscription.getSubscribeStatus())) {
        systemEmpNoSection = SystemEmpNoSectionResponse.builder()
                .visible(true)
                .editable(false)
                .value(sysEmpMap != null ? sysEmpMap.getSystemEmpNo() : null)
                .validationRequired(false)
                .subscriptionRequestEnabled(false)
                .message("구독 완료된 시스템 사번입니다.")
                .build();
    } else if (subscription != null && "APR".equals(subscription.getSubscribeStatus())) {
        systemEmpNoSection = SystemEmpNoSectionResponse.builder()
                .visible(true)
                .editable(false)
                .value(sysEmpMap != null ? sysEmpMap.getSystemEmpNo() : null)
                .validationRequired(false)
                .subscriptionRequestEnabled(false)
                .message("승인 대기 중인 시스템 사번입니다.")
                .build();
    } else {
        systemEmpNoSection = SystemEmpNoSectionResponse.builder()
                .visible(true)
                .editable(true)
                .value(null)
                .validationRequired(true)
                .subscriptionRequestEnabled(false)
                .message("시스템 사번 유효성 검사 후 구독 신청이 가능합니다.")
                .build();
    }

    return ApiDetailResponse.builder()
            .keyId(apiKey.getKeyId())
            .keyName(apiKey.getKeyName())
            .authCd(authCd)
            .subscriptionStatus(subscription != null ? subscription.getSubscribeStatus() : null)
            .systemEmpNoSection(systemEmpNoSection)
            .build();
}
4. 시스템 사번 유효성 검사 API
요청
POST /api/keys/{keyId}/system-emp-no/validate
Content-Type: application/json
{
  "svcId": "svc-001",
  "systemEmpNo": "20240001"
}
응답 성공
{
  "valid": true,
  "systemEmpNo": "20240001",
  "message": "유효한 시스템 사번입니다.",
  "subscriptionRequestEnabled": true
}
응답 실패
{
  "valid": false,
  "systemEmpNo": "20240001",
  "message": "유효하지 않은 시스템 사번입니다.",
  "subscriptionRequestEnabled": false
}
Validate 요청 DTO
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemEmpNoValidateRequest {
    private String svcId;
    private String systemEmpNo;
}
Validate 응답 DTO
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SystemEmpNoValidateResponse {
    private boolean valid;
    private String systemEmpNo;
    private String message;
    private boolean subscriptionRequestEnabled;
}
Validate API 컨트롤러
@PostMapping("/api/keys/{keyId}/system-emp-no/validate")
public ResponseEntity<SystemEmpNoValidateResponse> validateSystemEmpNo(
        @PathVariable Long keyId,
        @RequestBody SystemEmpNoValidateRequest request
) {
    return ResponseEntity.ok(apiSubscriptionService.validateSystemEmpNo(keyId, request));
}
Validate 서비스
public SystemEmpNoValidateResponse validateSystemEmpNo(Long keyId, SystemEmpNoValidateRequest request) {
    ApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Key 입니다."));

    if (!"SYS".equals(apiKey.getAuthCd())) {
        return SystemEmpNoValidateResponse.builder()
                .valid(false)
                .systemEmpNo(request.getSystemEmpNo())
                .message("SYS 권한 Key만 시스템 사번을 입력할 수 있습니다.")
                .subscriptionRequestEnabled(false)
                .build();
    }

    boolean valid = externalSystemEmpValidator.validate(request.getSystemEmpNo());

    return SystemEmpNoValidateResponse.builder()
            .valid(valid)
            .systemEmpNo(request.getSystemEmpNo())
            .message(valid ? "유효한 시스템 사번입니다." : "유효하지 않은 시스템 사번입니다.")
            .subscriptionRequestEnabled(valid)
            .build();
}
5. 구독 신청 API
요청
POST /api/keys/{keyId}/subscriptions/system-emp-no
Content-Type: application/json
{
  "svcId": "svc-001",
  "systemEmpNo": "20240001"
}
응답
{
  "keyId": 101,
  "subscriptionStatus": "APR",
  "systemEmpNo": "20240001",
  "message": "구독 신청이 완료되었습니다."
}
구독 신청 요청 DTO
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemEmpNoSubscriptionRequest {
    private String svcId;
    private String systemEmpNo;
}
구독 신청 응답 DTO
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SystemEmpNoSubscriptionResponse {
    private Long keyId;
    private String subscriptionStatus;
    private String systemEmpNo;
    private String message;
}
컨트롤러
@PostMapping("/api/keys/{keyId}/subscriptions/system-emp-no")
public ResponseEntity<SystemEmpNoSubscriptionResponse> requestSubscription(
        @PathVariable Long keyId,
        @RequestBody SystemEmpNoSubscriptionRequest request
) {
    return ResponseEntity.ok(apiSubscriptionService.requestSystemEmpNoSubscription(keyId, request));
}
서비스
@Transactional
public SystemEmpNoSubscriptionResponse requestSystemEmpNoSubscription(
        Long keyId,
        SystemEmpNoSubscriptionRequest request
) {
    ApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Key 입니다."));

    if (!"SYS".equals(apiKey.getAuthCd())) {
        throw new IllegalStateException("SYS 권한 Key만 구독 신청이 가능합니다.");
    }

    ApiSubscription existingSubscription = apiSubscriptionRepository.findLatestByKeyId(keyId).orElse(null);
    if (existingSubscription != null &&
            ("APR".equals(existingSubscription.getSubscribeStatus()) || "NOR".equals(existingSubscription.getSubscribeStatus()))) {
        throw new IllegalStateException("이미 구독 신청 중이거나 구독 완료된 Key 입니다.");
    }

    boolean valid = externalSystemEmpValidator.validate(request.getSystemEmpNo());
    if (!valid) {
        throw new IllegalArgumentException("유효성 검사가 완료되지 않은 시스템 사번입니다.");
    }

    ApiKeySysEmpMap map = apiKeySysEmpMapRepository.findByKeyId(keyId)
            .orElseGet(ApiKeySysEmpMap::new);

    map.setKeyId(keyId);
    map.setSvcId(request.getSvcId());
    map.setSystemEmpNo(request.getSystemEmpNo());
    apiKeySysEmpMapRepository.save(map);

    ApiSubscription subscription = new ApiSubscription();
    subscription.setKeyId(keyId);
    subscription.setSvcId(request.getSvcId());
    subscription.setSubscribeStatus("APR");
    apiSubscriptionRepository.save(subscription);

    return SystemEmpNoSubscriptionResponse.builder()
            .keyId(keyId)
            .subscriptionStatus("APR")
            .systemEmpNo(request.getSystemEmpNo())
            .message("구독 신청이 완료되었습니다.")
            .build();
}
