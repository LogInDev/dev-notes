네이밍 원칙 (짧고 강력)
	•	기능(feature) 접두어 → 역할(role): Ai/Chat/Thread/Popup + Composer/ResultPane/List/Item…
	•	도메인 우선 폴더/슬라이스: ai, threads, messages, ui
	•	Redux 액션: domain/ACTION_VERB_OBJECT (예: ai/SEND_REQUEST)
	•	컴포넌트: PascalCase, 컨테이너는 접미사 Container
	•	CSS 클래스: BEM + 최상위 네임스페이스 cube- (cube-ai__composer, cube-chat__message--mine)
	•	약어 금지: Msg, Res 대신 Message, Result

⸻

컴포넌트 이름 (클래스형 기준)

입력/전송 (Composer)
	•	AiComposer : AI 명령 입력 박스(텍스트/파일/명령어 자동완성)
	•	AiComposerContainer : Redux 연결·소켓 전송 담당(클래스)
	•	CommandSuggestionList : / 명령어 자동완성 드롭다운
	•	AttachmentPicker : 첨부

결과 패널 / 상세 보기
	•	AiResultPane : AI 응답 렌더(스트리밍 포함)
	•	AiResultBlock : 응답 블록(텍스트/카드/폼/설문 등) 단위
	•	RichNotificationItem : (네가 이미 사용) 리치 알림 카드

팝업
	•	AiResultPopup : 결과 전용 팝업(새창 포함)
	•	PopupPortal : 공용 포털(모달/새창 공통 진입)

채널/스레드/리스트
	•	ThreadList : 스레드(채팅방) 목록
	•	ThreadListItem
	•	AiThreadHeader : 스레드 제목/액션(팔로우, 알림 끄기 등)
	•	MessageList : 메시지 스크롤 리스트
	•	MessageItem : 단일 메시지(내/상대/AI 구분)
	•	DateSeparator : 날짜 바
	•	TypingIndicator : 타이핑 표시

레이아웃/뷰
	•	ChatView : 좌(채널/스레드) + 중(메시지) + 우(AI 결과/속성)
	•	ChannelView : 채널/DM 리스트(네가 가진 구조 유지)
	•	RightSidePanel : 우측 패널(리사이즈 가능)
	•	SplitResizer : 패널 사이 드래그 핸들

⸻

Redux 슬라이스/모듈 이름
	•	ai : AI 요청/응답/상태
	•	threads : 채널/스레드 메타 + 선택 상태
	•	messages : 메시지 엔티티(정규화)
	•	ui : 팝업/패널/로딩/토스트/우클릭 메뉴 등 UI 상태
	•	(옵션) socket : 연결 상태 및 이벤트 큐

⸻

액션 타입 & 액션 크리에이터 (실전 세트)

ai
	•	ai/SEND_REQUEST (payload: { threadId, prompt, attachments })
	•	ai/STREAM_CHUNK (payload: { requestId, delta })
	•	ai/COMPLETE_SUCCESS (payload: { requestId, messageId })
	•	ai/COMPLETE_FAILURE (payload: { requestId, error })
	•	ai/CANCEL_REQUEST (payload: { requestId })
	•	ai/SET_SUGGESTIONS (payload: { list })

threads
	•	threads/FETCH_LIST
	•	threads/SET_LIST (payload: { items })
	•	threads/SELECT (payload: { threadId })
	•	threads/UPSERT (payload: { thread })

messages
	•	messages/APPEND (payload: { threadId, message })
	•	messages/APPEND_MANY (payload: { threadId, messages })
	•	messages/UPSERT (payload: { message })
	•	messages/MARK_READ (payload: { threadId, messageId })
	•	messages/SET_SCROLL_ANCHOR (payload: { threadId, anchor: ‘bottom’|‘id’, id? })

ui
	•	ui/OPEN_POPUP (payload: { popupId, meta })
	•	ui/CLOSE_POPUP (payload: { popupId })
	•	ui/TOGGLE_RIGHT_PANEL (payload: { open })
	•	ui/SET_RIGHT_PANEL_WIDTH (payload: { width })
	•	ui/SHOW_TOAST / ui/HIDE_TOAST

실무 팁: 액션은 “무슨 일이 일어났는지” 과거형/사실형으로, 사이드이펙트는 사가/미들웨어에서.

⸻

셀렉터 이름 (메모이즈 권장)
	•	selectAiState(state)
	•	selectCurrentThreadId(state)
	•	selectThreadList(state)
	•	selectMessagesByThread(state, threadId)
	•	selectLastAiRequest(state, threadId)
	•	selectAiLoading(state, threadId)
	•	selectRightPanelOpen(state)
	•	selectRightPanelWidth(state)

⸻

폴더 구조 (feature-first, class 컴포넌트)

'''
src/
  components/
    chat/
      ChatView.js
      RightSidePanel.js
      SplitResizer.js
    thread/
      ThreadList.js
      ThreadListItem.js
      AiThreadHeader.js
    message/
      MessageList.js
      MessageItem.js
      DateSeparator.js
      TypingIndicator.js
    ai/
      AiComposerContainer.js   // redux 연결/전송 담당(클래스)
      AiComposer.js            // 프레젠테이셔널(클래스)
      CommandSuggestionList.js
      AiResultPane.js
      AiResultBlock.js
      AiResultPopup.js
      PopupPortal.js
  redux/
    ai/
      actions.js
      reducer.js
      selectors.js
      sagas.js                 // (Redux-Saga 쓸 경우)
      types.js
    threads/
      actions.js
      reducer.js
      selectors.js
      types.js
    messages/
      actions.js
      reducer.js
      selectors.js
      types.js
    ui/
      actions.js
      reducer.js
      selectors.js
      types.js
    rootReducer.js
    rootSaga.js
  styles/
    cube-ai.css
    cube-chat.css
    cube-thread.css
    cube-message.css
'''


이름 요약표 (바로 복붙용)
	•	컴포넌트:
AiComposer, AiComposerContainer, AiResultPane, AiResultBlock,
AiResultPopup, ThreadList, ThreadListItem, MessageList, MessageItem,
ChatView, ChannelView, RightSidePanel, SplitResizer, DateSeparator, TypingIndicator, PopupPortal, CommandSuggestionList, AttachmentPicker
	•	Redux 도메인: ai, threads, messages, ui
	•	액션:
ai/SEND_REQUEST, ai/STREAM_CHUNK, ai/COMPLETE_SUCCESS, ai/COMPLETE_FAILURE, ai/CANCEL_REQUEST, ai/SET_SUGGESTIONS
threads/FETCH_LIST, threads/SET_LIST, threads/SELECT, threads/UPSERT
messages/APPEND, messages/APPEND_MANY, messages/UPSERT, messages/MARK_READ, messages/SET_SCROLL_ANCHOR
ui/OPEN_POPUP, ui/CLOSE_POPUP, ui/TOGGLE_RIGHT_PANEL, ui/SET_RIGHT_PANEL_WIDTH, ui/SHOW_TOAST, ui/HIDE_TOAST
	•	셀렉터:
selectAiState, selectCurrentThreadId, selectThreadList, selectMessagesByThread, selectLastAiRequest, selectAiLoading, selectRightPanelOpen, selectRightPanelWidth
	•	CSS 네임스페이스:
.cube-ai__composer, .cube-ai__result-pane, .cube-message__item--ai, .cube-ai__popup

