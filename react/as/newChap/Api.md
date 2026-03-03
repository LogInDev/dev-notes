## DRM 설정 조회
### GET `/api/drm/config?svcId={svcId}`
- Response
    ```json
        {
      "success": true,
      "response": {
        "svcId": "SVC123",
        "svcType": "DRM",
        "rootKey": "rk_************abcd", 
        "allowIpList": [
          { "id": "IP1", "ipCidr": "10.0.0.1", "createdAt": "2026-03-03T01:23:45Z", "updatedAt": "2026-03-03T01:23:45Z" },
          { "id": "IP2", "ipCidr": "10.0.0.0/25", "createdAt": "2026-03-03T01:23:45Z", "updatedAt": "2026-03-03T02:00:00Z" }
        ]
      }
    }
    ```

## 시스템계정 사번 검증
### POST `/api/drm/empNo/verify`
- Request
  ```json
  {
    "svcId": "SVC123",
    "empNo": "X990001"
  }
  ```

- Response
  ```json
{
  "success": true,
  "response": {
    "status": "valid" 
  }
}
  ```
status 값:

valid : 유효하고 등록 가능

duplicated : 이미 등록된 사번

invalid : 존재하지 않거나 규칙 위반

프론트는 이 status로 토스트/문구 출력.

6-3) 허용 IP 추가/수정 (Upsert)

POST /api/drm/allow-ip/upsert

Request (추가)
{
  "svcId": "SVC123",
  "allowIpId": null,
  "ipCidr": "10.0.0.1/25"
}
Request (수정)
{
  "svcId": "SVC123",
  "allowIpId": "IP2",
  "ipCidr": "10.0.0.2/25"
}
Response (권장: 최신 리스트 반환)
{
  "success": true,
  "response": {
    "allowIpList": [
      { "id": "IP1", "ipCidr": "10.0.0.1", "createdAt": "2026-03-03T01:23:45Z", "updatedAt": "2026-03-03T01:23:45Z" },
      { "id": "IP2", "ipCidr": "10.0.0.2/25", "createdAt": "2026-03-03T01:23:45Z", "updatedAt": "2026-03-03T03:00:00Z" }
    ]
  }
}

서버 validation:

ipCidr 형식: IPv4 또는 CIDR(/0~32)

중복 방지 (svcId scope)

사번 검증이 통과된 상태에서만 허용(세션/토큰 기반으로)

6-4) 허용 IP 삭제

POST /api/drm/allow-ip/delete

Request
{
  "svcId": "SVC123",
  "allowIpId": "IP2"
}
Response
{
  "success": true,
  "response": {
    "allowIpList": [
      { "id": "IP1", "ipCidr": "10.0.0.1", "createdAt": "2026-03-03T01:23:45Z", "updatedAt": "2026-03-03T01:23:45Z" }
    ]
  }
}
7) 실무적으로 “버그 덜 나는” 백엔드 모델 추천
테이블 예시

drm_service_config

svc_id (PK)

root_key_hash (원문 저장 금지 / 해시 또는 vault 참조)

updated_at

drm_empno_registry

svc_id

emp_no

status (ACTIVE)

created_at

drm_allow_ip

id (PK)

svc_id

ip_cidr (varchar, unique(svc_id, ip_cidr))

created_at, updated_at
