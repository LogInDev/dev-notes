# Saga
## Saga로 안 빼도 되는 케이스 (이번 케이스가 여기에 해당)
- Detail 화면에서만 쓰는 로컬 플로우
- 결과를 다른 화면/탭에서 재사용할 필요 없음
- Redux state에 넣지 않아도 되는 UI 보조 상태(검증/입력폼)
- 호출 타이밍이 명확히 버튼 클릭 1회 (자동 재시도/취소/경합 제어 필요 낮음)

➡️ 그래서 이번처럼 useState + useRef(Map cache)로 처리하는 게 가장 실무적이고 빠르고, 성능도 충분히 좋음.

## Saga로 빼는 게 맞는 케이스
아래 중 하나라도 해당하면 Saga로 빼는 게 “실무적으로” 더 깔끔해져.
- 검증 결과를 여러 화면에서 공유해야 함 <br /> 예: Total에서도 DRM 사번 검증 결과를 재사용하고 싶다
- 검증 결과가 서버 상태에 가깝다 <br /> 예: 검증 성공 시 서버에 세션/토큰/승인 상태가 저장됨
- 요청 취소/경합 제어가 중요 <br />예: 입력 바뀔 때마다 자동 검증(디바운스) + 이전 요청 취소가 필요
- 에러 처리/로딩/재시도 정책을 통일해야 함 <br /> 예: 공통 API 에러 처리/로깅/알림 정책이 Redux-Saga 레벨에서 관리됨

## “성능” 관점에서 Saga가 더 좋냐?
거의 차이 없어.
성능은 Saga 여부가 아니라, 아래가 더 중요해:
- 호출을 언제 하느냐 (입력마다 X, 클릭 시 1회 O)
- 동일 요청을 캐싱하느냐 (O)
- 불필요한 렌더/리덕스 전파를 만들지 않느냐 (로컬 state가 오히려 유리)

✅ 그래서 지금 구조에서는 Saga로 빼지 않는 게 성능/복잡도 모두 이득이야.

# 전체 프로젝트 구조 + 사가 흐름 (너 코드 기준 “진짜 흐름”)
너 프로젝트는 크게 3층으로 흐른다:
## A. Route 진입 계층 (RoutesPath)
앱 시작 시 한 번:
- fetchCategory()
- fetchKey()
- fetchIsAdmin()

그리고 fetchKeySuccess 되면:
- localStorage의 apiStoreKey를 읽고
- 없으면 keyList[0]으로 세팅
- keySelect.selectedKeyId를 updateField로 저장
즉 “키 선택 상태”는 앱 전역 선행조건이야.
List/Detail/Dashboard가 다 이 키를 참조함.

## B. 화면 계층 (Total / ApiDetail / DashDetail)
각 페이지는 “액션만 dispatch”하고,
데이터 가공은 보통 컴포넌트에서 useMemo(produce(...))로 하고 있어.
### Total(list 화면)
- selectedKeyId 확정되면 fetchServiceList({keyword, sortBy, category, keyId})
- expand 시 fetchApiListByService({svcId, keyId})
- (추가로 여기선 컴포넌트에서 axios 직접 호출도 섞여있음: authCd, permission 확인)

즉 Total은:
- slice(list)에 서비스 목록 + 서비스별 api 목록 캐시를 갖고 있음

## ApiDetail(detail 화면)
마운트:
- increaseViewCount(svcId)

언마운트:
- initState()

권한/키/성공 상태에 따라 fetch:
- fetchServiceDetail({svcId})
- fetchApiList({svcId, keyId})
- fetchManagerList({svcId})
- (권한자만) fetchHistoryList({svcId})
- fetchSubscriptionPermission({svcId, keyId})

요청 액션들:
- requestSubscriptionPermission
- requestSubscribe
- cancelSubscribe
- reserveDeleteService
- cancelDeleteReserve

요청 성공하면:
- initState() 후 다시 fetch 세트 돌림 (새로고침 패턴)

## DashDetail(dashboard detail)
- 탭은 UI 레벨 상태
- fetchServiceDetail({svcId, svcType})로 svcType 기반 추가 탭 구성

## C. Redux-saga 계층 (비동기)
각 slice 액션을 saga가 takeLatest로 받아서 axios 호출 후 success/fail dispatch.

특징:
- 대부분 “로딩 true → success에서 false” 구조
- fail이 비어있거나 catch에서 아무것도 안 하는 곳이 있어서 로딩 stuck 가능
