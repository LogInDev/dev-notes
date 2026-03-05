# DRM API Spec

DRM 서비스에서 사용하는 API 요청/응답 형식 정의

---

# 1. 시스템 계정 사번 유효성 확인

시스템 계정 사번이 유효한지 확인하는 API

## Request

**GET**

/drm/empNo/verify?empNo=X990001

### Query Parameter

| name | type | description |
|-----|------|-------------|
| empNo | string | X99로 시작하는 시스템 계정 사번 |

---

## Response (200)

```json
{
  "response": {
    "status": "VALID"
  }
}
```

### status 값

| status | 의미 |
|------|------|
| VALID | 사용 가능한 시스템 계정 |
| DUPLICATED | 이미 등록된 시스템 계정 |
| INVALID | 유효하지 않은 시스템 계정 |

---

## Example Response

### VALID

```json
{
  "response": {
    "status": "VALID"
  }
}
```

### DUPLICATED

```json
{
  "response": {
    "status": "DUPLICATED",
    "message": "Already registered"
  }
}
```

### INVALID

```json
{
  "response": {
    "status": "INVALID",
    "message": "Not found"
  }
}
```

---

# 2. DRM 허용 IP 목록 조회

서비스 상세 조회 시 DRM 허용 IP 목록도 함께 반환

## Request

**GET**

/api/dtl?svcId=12345

---

## Response

```json
{
  "response": {
    "svcId": "12345",
    "svcType": "DRM",
    "rootKey": "qzLD1O9mBxg5OktLXG+PkA==",
    "drm": {
      "allowIps": [
        {
          "allowIpId": 101,
          "ipCidr": "10.0.0.1"
        },
        {
          "allowIpId": 102,
          "ipCidr": "10.0.0.0/25"
        }
      ]
    }
  }
}
```

### Field

| field | type | description |
|------|------|-------------|
| svcId | string | 서비스 ID |
| svcType | string | 서비스 타입 (DRM) |
| rootKey | string | DRM Root Key |
| drm.allowIps | array | 허용 IP 목록 |

---

# 3. DRM 허용 IP 추가

## Request

**POST**

/drm/allow-ips

### Body

```json
{
  "svcId": "12345",
  "ipCidr": "10.0.0.0/25"
}
```

### Field

| name | type | description |
|-----|------|-------------|
| svcId | string | 서비스 ID |
| ipCidr | string | 단일 IP 또는 CIDR |

### 허용 예시

```
10.0.0.1
10.0.0.0/25
```

---

## Response

```json
{
  "response": {
    "allowIpId": 103,
    "ipCidr": "10.0.0.0/25"
  }
}
```

---

## Error (409)

이미 등록된 IP

```json
{
  "message": "DUPLICATED_ALLOW_IP"
}
```

---

# 4. DRM 허용 IP 수정

## Request

**PUT**

/drm/allow-ips/{allowIpId}

### Example

/drm/allow-ips/103

### Body

```json
{
  "svcId": "12345",
  "ipCidr": "10.0.0.0/26"
}
```

---

## Response

```json
{
  "response": {
    "allowIpId": 103,
    "ipCidr": "10.0.0.0/26"
  }
}
```

---

## Error (409)

```json
{
  "message": "DUPLICATED_ALLOW_IP"
}
```

---

# 5. DRM 허용 IP 삭제

## Request

**DELETE**

/drm/allow-ips/{allowIpId}?svcId=12345

### Example

/drm/allow-ips/103?svcId=12345

---

## Response

```json
{
  "response": {
    "deleted": true
  }
}
```

---

# 6. DRM Root Key 수정

## Request

**PUT**

/drm/root-key

### Body

```json
{
  "svcId": "12345",
  "rootKey": "NEW_ROOT_KEY_VALUE_BASE64=="
}
```

### Field

| name | type | description |
|-----|------|-------------|
| svcId | string | 서비스 ID |
| rootKey | string | 변경할 Root Key |

---

## Response

```json
{
  "response": {
    "svcId": "12345",
    "rootKey": "NEW_ROOT_KEY_VALUE_BASE64=="
  }
}
```

---

# Validation Rules

### 사번(empNo)

- 반드시 `X99` 로 시작
- 정규식

```
^X99\d+$
```

---

### 허용 IP

허용 형식

```
10.0.0.1
10.0.0.0/25
```

허용하지 않는 형식

```
10.0.0.1~10.0.0.10
```

---

# Error Code

| HTTP | Code | Description |
|-----|------|-------------|
| 400 | INVALID_EMP_NO | 사번 형식 오류 |
| 404 | EMP_NO_NOT_FOUND | 사번 존재하지 않음 |
| 409 | DUPLICATED_ALLOW_IP | 허용 IP 중복 |
| 500 | INTERNAL_SERVER_ERROR | 서버 오류 |

---

# Flow

DRM 서비스 구독 절차

```
1. 시스템 사번 입력
2. 사번 유효성 확인 API 호출
3. RootKey 설정
4. 허용 IP 등록
5. 구독 신청
```