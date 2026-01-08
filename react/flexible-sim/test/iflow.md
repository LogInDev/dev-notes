CUBE AI Assistant / AI Thread 인수인계서

0. 문서 정보
	•	문서명: CUBE AI Assistant 기능 인수인계서
	•	작성자/작성일: (작성)
	•	적용 범위: Web(React 16.14 Class) / Server(Spring, Vert.x) / Redis / Socket
	•	관련 모듈: ChatView, ChannelView, AssistantView, AIThreadList, AIThreadItem, AssistantPopup, messageRouter, RichNotificationItem

⸻

1. 목적 및 배경

1-1. 목적
	•	사내 메신저(CUBE) 내에서 AI 챗봇 메시지를 웹 화면에 노출하고,
	•	사용자가 AI Thread(대화 스레드) 를 생성/조회/닫기/삭제하며,
	•	AI가 내려주는 우리 JSON 포맷(RichNotification 등)을 시뮬레이션/렌더링 할 수 있도록 고도화함.

1-2. 핵심 사용자 시나리오
	1.	사용자가 /AI(또는 지정 명령어)로 질의 → 새 AI Thread 생성
	2.	생성된 Thread가 목록에 추가되고 우측 패널에 열림(또는 팝업)
	3.	AI 응답 메시지(텍스트/마크다운/리치 JSON)가 messageRouter를 통해 렌더링
	4.	Thread는 “패널 1개만” + “팝업 여러 개” 정책으로 관리됨
	5.	사용자는 Thread 닫기/삭제 수행 가능

⸻

2. 시스템 구성(요약)

2-1. Front (React 16.14, Class Component)
	•	상태관리: Redux (일부 saga 사용)
	•	렌더링: messageRouter → 타입별 컴포넌트 매핑
	•	팝업: react-new-window
	•	스크롤: slimscroll 사용 구간 존재
	•	전역 접근: GlobalStore(Store.getStore()), Socket.getApi() 사용 패턴

2-2. Server
	•	Spring / Vert.x / Redis 기반
	•	소켓 이벤트 기반 메시지 수신 → Redux SET_MESSAGE 등으로 화면 반영

⸻

3. 추가된 기능(상세)

3-1. AI Thread 생성 기능

기능 설명
	•	AI Thread 생성 경로(멀티 진입점)
	1.	“Thread 생성 버튼” 클릭
	2.	“Thread 생성 +” 버튼 클릭
	3.	CH/DM 입력란에서 /AI(대소문자 무관) 명령어로 질의 입력 후 Enter
	4.	CH/DM 입력란에서 @@ 명령어(정의된 동작에 따라 Thread 생성/열기)

정책/제약
	•	3초 이내 중복 생성 시 경고 표시(동일 동작 반복 방지)
	•	생성 성공 시:
	•	Thread 목록에 New Chat 추가
	•	우측 패널에 해당 Thread 자동 오픈(기본)

프론트 처리 흐름(권장 흐름)
	1.	사용자 입력/버튼 이벤트
	2.	Socket.getApi() 또는 HTTP API 호출로 Thread 생성 요청
	3.	성공 응답 수신 → Redux에 threadList 추가 + currentChannel 변경
	4.	UI: 패널 오픈 / 메시지 영역 초기화

⸻

3-2. Thread 오픈 정책 (패널 vs 팝업)

정책
	•	우측 패널: Thread 1개만 열 수 있음
	•	팝업: 여러 개 열 수 있음
	•	동일 Thread는 패널 또는 팝업 중 하나에만 존재해야 함 (중복 오픈 금지)

상태(예시)
	•	aiThread.currentChannel : 패널에 열린 threadId
	•	aiThread.currentPopupThread : 팝업으로 열린 threadId 배열

⸻

3-3. Thread 닫기/전환 로직

목표
	•	“열려있는 스레드만 닫기”
	•	“패널 전환 시 기존 패널 스레드는 닫기”
	•	“팝업 스레드는 해당 팝업만 닫기”
	•	“동일 스레드 중복 닫기 방지”

케이스 정의
	1.	type === 'panel' 로 패널 스레드 열기/닫기 요청
	2.	type === 'popup' 로 팝업 스레드 닫기 요청
	3.	요청한 threadId가 실제 열려있는지 검사 후 처리

주의사항(실제 장애 포인트)
	•	openedPopupThreads.find(...) 조건만으로 “열림 여부” 판단하면
패널/팝업 동시 케이스, 또는 전환 중 상태에서 중복 close 발생 가능
	•	해결 포인트:
	•	“닫을 대상”을 정확히 한 번만 결정(패널/팝업 분기 명확화)
	•	close API 호출과 Redux dispatch를 동일 대상에 대해 1회만 수행

⸻

3-4. 메시지 렌더링(우리 JSON 포맷)

개요
	•	메시지는 messageRouter를 통해 타입별로 렌더링
	•	RichNotificationItem은 MessageBase 상속 클래스형 컴포넌트
	•	message의 list[] 내부에서 특정 type(X/Y 등) 인 경우만 렌더링

렌더 구조
	•	renderExtra → renderRow → renderColumn 형태로 반복 렌더링
	•	동적으로 CSS 적용하는 렌더링 함수 다수 포함

운영 포인트
	•	list 렌더 시 key 누락 경고 발생 가능 → 고유 key 보장 필요
	•	대량 메시지에서 불필요한 setState 반복 시 “Maximum update depth” 위험
→ componentDidUpdate에서 조건 비교 후 최소 setState, 또는 Redux 중심으로 설계

⸻

3-5. Markdown 렌더링 기능

사용 라이브러리(예시)
	•	react-markdown@5.0.3
	•	remark-gfm@1.0.0
	•	rehype-raw@4.0.2 (빌드/uglify 이슈 경험 있음)

주요 요구사항
	•	마크다운 내 링크 클릭 시 새창 열기
	•	리스트/줄바꿈/ol 처리 문제 발생 가능
→ 입력 텍스트 전처리(\n 보정)로 해결한 케이스 존재

⸻

3-6. “하루 동안 안보기” (프론트 단독 저장)

기능 설명
	•	서버 없이 동작
	•	“AI 입력창 + Info창” 표시 여부를 로컬스토리지에 사용자별 저장
	•	단축키(Ctrl+E) 또는 AI 버튼 클릭 시:
	•	하루동안 안보기 체크면: 입력창만 노출
	•	미체크면: 입력창 + Info창 노출
	•	Info 토글(화살표 버튼) 시에도 체크 상태 반영 필요

주의사항
	•	컴포넌트 언마운트 이후 setState 호출 경고(메모리릭) 발생 가능
→ componentWillUnmount에서 타이머/소켓/비동기 콜백 정리 필수

⸻

3-7. 버튼 클릭으로 특정 API 실행(예: iFlow 버튼)

기능 설명
	•	RichNotification 내부 버튼 클릭 시
	•	특정 팝업 열기 또는 API 호출
	•	“richnotification 메시지 자체”를 payload로 전송하는 요구사항 존재

⸻

4. 소켓 → Redux 반영 흐름

요약 시퀀스
	1.	openChannel(...)
	2.	Sock.getApi(...)
	3.	callbackhandler(...)
	4.	apihandler(...)
	5.	Redux SET_MESSAGE (또는 유사 action)
	6.	messageRouter 렌더

운영 포인트
	•	소켓 이벤트가 연속으로 들어올 때:
	•	불필요한 setState/forceUpdate 반복 금지
	•	reducer는 불변성/성능 고려(특히 메시지 append)

⸻

5. API 명세(인수인계용)

⚠️ 사내 규칙: API 응답 객체는 항상 status, message, data 고정 필드 포함

아래는 인수인계서 표준 포맷이야. 실제 URL/필드명은 서버 구현 기준으로 치환해서 쓰면 됨.

⸻

5-1. AI Thread 생성
	•	Method: POST
	•	URL: /api/ai/thread
	•	Request
	•	channelId (string) : 생성 위치(채널/DM)
	•	query (string) : 사용자 질의
	•	openType (string) : panel | popup
	•	Response
	•	status: SUCCESS | FAIL
	•	message: 결과 메시지
	•	data:
	•	threadId (string)
	•	title (string)
	•	createdAt (string)
	•	비고
	•	3초 이내 중복 생성 요청 시: 프론트에서 방지 + 서버도 중복 방어 권장

⸻

5-2. AI Thread 목록 조회
	•	Method: GET
	•	URL: /api/ai/thread
	•	Request Query
	•	channelId (string)
	•	page (number), size (number)
	•	Response.data
	•	items: thread summary list
	•	pageInfo: paging

⸻

5-3. AI Thread 닫기(close)
	•	Method: POST (또는 PATCH)
	•	URL: /api/ai/thread/{threadId}/close
	•	Request
	•	closeType: panel | popup
	•	Response.data
	•	threadId
	•	closedAt
	•	프론트 처리 규칙
	•	“실제로 열려있는 thread만 close API 호출”
	•	패널 전환 시:
	•	이전 패널 thread가 존재하면 먼저 close 처리 후 새 thread open

⸻

5-4. AI Thread 삭제(delete)
	•	Method: DELETE
	•	URL: /api/ai/thread/{threadId}
	•	Response.data
	•	threadId
	•	deletedAt
	•	주의
	•	삭제 후 UI에서 해당 thread가 열려있던 상태면:
	•	패널이면 currentChannel 초기화/대체 선택
	•	팝업이면 popup 리스트에서 제거 + 창 닫기 동기화

⸻

5-5. 메시지 전송(사용자 → AI)
	•	Method: POST
	•	URL: /api/ai/thread/{threadId}/message
	•	Request
	•	text (string)
	•	meta (object) : (선택) 버튼/폼 입력값 등
	•	Response.data
	•	messageId
	•	threadId
	•	queued (boolean)

⸻

5-6. 리치 JSON(시뮬레이터/렌더링 테스트) 전송
	•	Method: POST
	•	URL: /api/ai/simulate
	•	Request
	•	payload : 우리 JSON 포맷 원문(예: richnotification 전체)
	•	Response.data
	•	messageId
	•	renderType (string)
	•	payloadEcho (optional)

⸻

6. 에러/장애 이력 & 해결 포인트

6-1. Maximum update depth exceeded
	•	원인: componentDidUpdate/componentWillReceiveProps에서 조건 없이 setState 반복
	•	해결:
	•	prev/next 비교 후 필요한 경우에만 setState
	•	가능하면 “UI 상태”만 state로, 데이터는 Redux로 일원화

6-2. Can't perform a React state update on an unmounted component
	•	원인: 비동기 콜백/소켓 리스너/타이머가 언마운트 후 실행
	•	해결:
	•	componentWillUnmount에서 구독/타이머/리스너 해제
	•	언마운트 플래그로 setState 방어

6-3. list key 경고
	•	원인: map 렌더에 key 미지정 또는 index만 사용
	•	해결:
	•	messageId/threadId/rowId 등 고유값 기반 key 부여

6-4. 마크다운 ol/줄바꿈 문제
	•	원인: 입력 텍스트에 줄바꿈 규칙이 gfm 파서와 불일치
	•	해결:
	•	텍스트 전처리로 \n 보정(줄바꿈 있는 문단은 한 줄 더 추가)

⸻

7. 운영/배포/환경 체크리스트
	•	Windows 배포: Nginx + NSSM 사용
	•	프론트:
	•	빌드 모드/환경변수(global.CONFIG) 확인
	•	소켓 엔드포인트/프록시 설정 확인
	•	서버:
	•	Redis 연결/키 만료 정책 확인(세션/스레드 상태 관련)
	•	Thread close/delete 시 정합성(서버 상태 vs 클라이언트 상태) 검증

⸻

8. 인수인계자가 바로 확인할 테스트 시나리오
	1.	/AI 질문으로 Thread 생성 → 3초 내 연타 시 경고 확인
	2.	패널 Thread 열고 → 다른 Thread 패널로 전환 → 기존 패널 close 1회만 호출되는지 확인
	3.	팝업 2개 이상 오픈 → 특정 팝업 close 시 해당 thread만 닫히는지 확인
	4.	동일 thread를 패널/팝업 동시 오픈 시도 → 반드시 한쪽만 열리도록 방어 확인
	5.	메시지 수신 폭주 상황에서도 렌더링/스크롤/메모리릭 없는지 확인
	6.	마크다운 링크 클릭 시 새창 오픈 확인
	7.	“하루동안 안보기” 체크/해제/토글/재접속 유지 확인