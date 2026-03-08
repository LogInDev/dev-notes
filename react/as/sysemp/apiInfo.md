# DRM 시스템 사번 기능 설계 정리 (수정본)

아래 내용은 **현재 적용한 프론트 구조(`detail/reducer.js`, `detail/saga.js`, `ApiDetail.jsx`, `DrmEmpNoSection.jsx`) 기준으로 수정한 최종안**이다.

핵심 변경점은 다음과 같다.

1. **시스템 사번 정보는 `fetchServiceDetail`에 포함하지 않고, 선택된 `keyId` 기준 별도 API로 조회한다.**
2. **프론트는 `serviceDetail`이 아니라 `detail.drmEmpNo.info` 상태를 사용한다.**
3. **시스템 사번 구독 신청은 하단 공통 구독 버튼이 아니라 `DrmEmpNoSection` 내부 전용 버튼으로 처리한다.**
4. 따라서 기존 설명의 `ApiDetailResponse getApiDetail(Long keyId)` 구조는 현재 적용 코드 기준으로는 **별도 DRM API**로 분리하는 쪽이 맞다.

---

## 1. 프론트 처리 기준 요약

현재 프론트는 아래 흐름으로 동작한다.

1. 사용자가 Key 선택
2. `selectedKey.keyId`가 바뀜
3. `fetchDrmEmpNoInfo({ svcId, keyId })` 호출
4. 백엔드가 **선택 Key 기준 시스템 사번 상태**를 내려줌
5. `DrmEmpNoSection`이 아래 규칙으로 렌더링함
   - `editable = false` → RootKey처럼 read-only 표시
   - `editable = true` → input + 유효성 검사 버튼 + 구독 신청 버튼

즉, **시스템 사번 상태는 서비스 공통 상세가 아니라, 선택된 Key 기준 상세 정보**다.

---

## 2. 선택 Key 기준 시스템 사번 상태 조회 API

### 요청

```http
GET /drm/empNo/info?svcId={svcId}&keyId={keyId}
```

### 응답 예시

```json
{
  "response": {
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
}
```

### 상태별 응답 규칙

#### 1) SYS + NOR

```json
{
  "response": {
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
}
```

#### 2) SYS + APR

```json
{
  "response": {
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
}
```

#### 3) SYS + 미신청

```json
{
  "response": {
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
}
```

#### 4) SYS 아님

```json
{
  "response": {
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
}
```

---

## 3. 백엔드 DTO 예시

### `DrmEmpNoInfoResponse.java`

```java
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DrmEmpNoInfoResponse {
    private String authCd;
    private String subscriptionStatus;
    private SystemEmpNoSectionResponse systemEmpNoSection;
}
```

### `SystemEmpNoSectionResponse.java`

```java
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
```

> 수정 포인트:
>
> - 기존 설명의 `ApiDetailResponse`는 현재 프론트 구조와 안 맞다.
> - 지금 구조에서는 `fetchServiceDetail`과 별도로 **`DrmEmpNoInfoResponse`** 를 두는 것이 맞다.
> - `keyId`, `keyName`은 이 응답에 굳이 넣지 않아도 된다. 이미 프론트는 선택된 key를 `keySelect` store에서 알고 있다.

---

## 4. 선택 Key 기준 시스템 사번 상태 조회 서비스 로직 예시

```java
public DrmEmpNoInfoResponse getDrmEmpNoInfo(String svcId, Long keyId) {
    ApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Key 입니다."));

    String authCd = apiKey.getAuthCd();

    ApiSubscription subscription = apiSubscriptionRepository
            .findLatestBySvcIdAndKeyId(svcId, keyId)
            .orElse(null);

    ApiKeySysEmpMap sysEmpMap = apiKeySysEmpMapRepository
            .findBySvcIdAndKeyId(svcId, keyId)
            .orElse(null);

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

    return DrmEmpNoInfoResponse.builder()
            .authCd(authCd)
            .subscriptionStatus(subscription != null ? subscription.getSubscribeStatus() : null)
            .systemEmpNoSection(systemEmpNoSection)
            .build();
}
```

### 수정 포인트

기존 설명 대비 수정해야 하는 부분은 아래와 같다.

1. 메서드명이 `getApiDetail(Long keyId)`가 아니라 **`getDrmEmpNoInfo(String svcId, Long keyId)`** 가 맞다.
2. 조회 기준은 `keyId`만이 아니라 **`svcId + keyId`** 조합으로 보는 것이 안전하다.
3. 시스템 사번 매핑 조회도 `findByKeyId(keyId)`보다 **`findBySvcIdAndKeyId(svcId, keyId)`** 가 맞다.
4. 현재 프론트는 이 응답을 `detail.drmEmpNo.info`에 저장해서 사용한다.

---

## 5. 시스템 사번 유효성 검사 API

현재 프론트 saga 기준으로는 **GET 방식 + query param** 구조다.

### 요청

```http
GET /drm/empNo/verify?svcId={svcId}&keyId={keyId}&empNo={empNo}
```

예시:

```http
GET /drm/empNo/verify?svcId=svc-001&keyId=101&empNo=20240001
```

### 응답 성공

```json
{
  "response": {
    "empNo": "20240001",
    "status": "VALID"
  }
}
```

### 응답 실패 또는 중복 예시

```json
{
  "response": {
    "empNo": "20240001",
    "status": "INVALID"
  }
}
```

```json
{
  "response": {
    "empNo": "20240001",
    "status": "DUPLICATED"
  }
}
```

### 응답 DTO 예시

```java
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerifyDrmEmpNoResponse {
    private String empNo;
    private String status; // VALID | DUPLICATED | INVALID
}
```

### 컨트롤러 예시

```java
@GetMapping("/drm/empNo/verify")
public ResponseEntity<ApiResponse<VerifyDrmEmpNoResponse>> verifySystemEmpNo(
        @RequestParam String svcId,
        @RequestParam Long keyId,
        @RequestParam String empNo
) {
    return ResponseEntity.ok(ApiResponse.success(
            drmSubscriptionService.verifySystemEmpNo(svcId, keyId, empNo)
    ));
}
```

### 서비스 예시

```java
public VerifyDrmEmpNoResponse verifySystemEmpNo(String svcId, Long keyId, String empNo) {
    ApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Key 입니다."));

    if (!"SYS".equals(apiKey.getAuthCd())) {
        return VerifyDrmEmpNoResponse.builder()
                .empNo(empNo)
                .status("INVALID")
                .build();
    }

    boolean duplicated = apiKeySysEmpMapRepository.existsBySvcIdAndSystemEmpNo(svcId, empNo);
    if (duplicated) {
        return VerifyDrmEmpNoResponse.builder()
                .empNo(empNo)
                .status("DUPLICATED")
                .build();
    }

    boolean valid = externalSystemEmpValidator.validate(empNo);

    return VerifyDrmEmpNoResponse.builder()
            .empNo(empNo)
            .status(valid ? "VALID" : "INVALID")
            .build();
}
```

### 수정 포인트

기존 설명에서는 아래처럼 정의했었다.

- `POST /api/keys/{keyId}/system-emp-no/validate`
- 응답: `valid: true/false`

하지만 현재 적용한 프론트 코드 기준으로는 아래가 맞다.

- `GET /drm/empNo/verify?svcId=...&keyId=...&empNo=...`
- 응답: `status = VALID | DUPLICATED | INVALID`

즉, **현재 프론트 saga와 맞추려면 기존 validate API 설명은 바꿔야 한다.**

---

## 6. 시스템 사번 구독 신청 API

현재 프론트 saga 기준으로는 아래 API를 사용한다.

### 요청

```http
POST /drm/subscribe
Content-Type: application/json
```

```json
{
  "svcId": "svc-001",
  "keyId": 101,
  "empNo": "20240001"
}
```

### 응답

```json
{
  "response": {
    "keyId": 101,
    "subscriptionStatus": "APR",
    "systemEmpNo": "20240001",
    "message": "구독 신청이 완료되었습니다."
  }
}
```

### 요청 DTO

```java
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestDrmSubscribeRequest {
    private String svcId;
    private Long keyId;
    private String empNo;
}
```

### 응답 DTO

```java
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RequestDrmSubscribeResponse {
    private Long keyId;
    private String subscriptionStatus;
    private String systemEmpNo;
    private String message;
}
```

### 컨트롤러

```java
@PostMapping("/drm/subscribe")
public ResponseEntity<ApiResponse<RequestDrmSubscribeResponse>> requestDrmSubscribe(
        @RequestBody RequestDrmSubscribeRequest request
) {
    return ResponseEntity.ok(ApiResponse.success(
            drmSubscriptionService.requestDrmSubscribe(request)
    ));
}
```

### 서비스

```java
@Transactional
public RequestDrmSubscribeResponse requestDrmSubscribe(RequestDrmSubscribeRequest request) {
    ApiKey apiKey = apiKeyRepository.findById(request.getKeyId())
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Key 입니다."));

    if (!"SYS".equals(apiKey.getAuthCd())) {
        throw new IllegalStateException("SYS 권한 Key만 구독 신청이 가능합니다.");
    }

    ApiSubscription existingSubscription = apiSubscriptionRepository
            .findLatestBySvcIdAndKeyId(request.getSvcId(), request.getKeyId())
            .orElse(null);

    if (existingSubscription != null &&
            ("APR".equals(existingSubscription.getSubscribeStatus()) ||
             "NOR".equals(existingSubscription.getSubscribeStatus()))) {
        throw new IllegalStateException("이미 구독 신청 중이거나 구독 완료된 Key 입니다.");
    }

    boolean valid = externalSystemEmpValidator.validate(request.getEmpNo());
    if (!valid) {
        throw new IllegalArgumentException("유효성 검사가 완료되지 않은 시스템 사번입니다.");
    }

    ApiKeySysEmpMap map = apiKeySysEmpMapRepository
            .findBySvcIdAndKeyId(request.getSvcId(), request.getKeyId())
            .orElseGet(ApiKeySysEmpMap::new);

    map.setSvcId(request.getSvcId());
    map.setKeyId(request.getKeyId());
    map.setSystemEmpNo(request.getEmpNo());
    apiKeySysEmpMapRepository.save(map);

    ApiSubscription subscription = new ApiSubscription();
    subscription.setSvcId(request.getSvcId());
    subscription.setKeyId(request.getKeyId());
    subscription.setSubscribeStatus("APR");
    apiSubscriptionRepository.save(subscription);

    return RequestDrmSubscribeResponse.builder()
            .keyId(request.getKeyId())
            .subscriptionStatus("APR")
            .systemEmpNo(request.getEmpNo())
            .message("구독 신청이 완료되었습니다.")
            .build();
}
```

### 수정 포인트

기존 설명에서는 아래처럼 정의했었다.

- `POST /api/keys/{keyId}/subscriptions/system-emp-no`
- 요청 body: `svcId`, `systemEmpNo`

하지만 현재 적용 프론트 기준으로는 아래가 맞다.

- `POST /drm/subscribe`
- 요청 body: `svcId`, `keyId`, `empNo`

즉, **컨트롤러 path, 요청 DTO, 필드명 모두 수정해야 한다.**

---

## 7. 최종 정리: 기존 설명에서 꼭 수정해야 하는 부분

### 유지해도 되는 부분

- 상태별 화면 규칙 (`NOR`, `APR`, 미신청, SYS 아님)
- `editable`, `visible`, `message` 기반으로 프론트가 그리는 방식
- 신청 시 `APR` 상태 + 시스템 사번 매핑 저장 구조

### 수정해야 하는 부분

1. **조회 API는 `ApiDetail` 통합 응답이 아니라 별도 DRM API로 분리**
   - 기존: `getApiDetail(Long keyId)`
   - 수정: `getDrmEmpNoInfo(String svcId, Long keyId)`

2. **조회 기준은 `keyId` 단독보다 `svcId + keyId` 사용**
   - subscription 조회
   - systemEmpNo 매핑 조회

3. **유효성 검사 API 스펙 수정**
   - 기존: `POST /api/keys/{keyId}/system-emp-no/validate`
   - 수정: `GET /drm/empNo/verify?svcId=...&keyId=...&empNo=...`

4. **유효성 검사 응답 스펙 수정**
   - 기존: `valid: true/false`
   - 수정: `status: VALID | DUPLICATED | INVALID`

5. **구독 신청 API 스펙 수정**
   - 기존: `POST /api/keys/{keyId}/subscriptions/system-emp-no`
   - 수정: `POST /drm/subscribe`

6. **구독 신청 요청 필드 수정**
   - 기존: `systemEmpNo`
   - 수정: `empNo`

7. **현재 프론트는 시스템 사번 구독 신청을 하단 공통 구독 버튼이 아니라 `DrmEmpNoSection` 내부 전용 버튼으로 처리**

---

## 8. 추천 결론

현재 네가 적용한 프론트 코드 기준으로는,

- 서비스 공통 정보는 `fetchServiceDetail({ svcId })`
- 선택 Key 기준 DRM 시스템 사번 상태는 `fetchDrmEmpNoInfo({ svcId, keyId })`

이렇게 **책임을 분리하는 구조가 맞다.**

그래서 기존 설명은 개념적으로는 맞지만, **현재 실제 적용 코드와 맞추려면 API 경로/DTO/서비스 메서드 시그니처를 위 내용대로 수정해야 한다.**
