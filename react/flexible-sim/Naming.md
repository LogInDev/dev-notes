1) 컴포넌트 (클래스형)
	•	AssistantView : 우측 AI 비서 메인 뷰(패널 헤더/바디 래퍼)
	•	AssistantComposerContainer : 전송 로직/Redux 연결
	•	AssistantComposer : 입력창(텍스트/단축키/전송 버튼)
	•	AssistantCommandList : / 명령어/자동완성 드롭다운
	•	AssistantAttachmentPicker : 파일 첨부
	•	AssistantResultPane : 응답 전체 영역(리스트)
	•	AssistantResultBlock : 응답 블록(텍스트/카드/폼/코드 조각)
	•	AssistantStreamingLine : 스트리밍 중간 라인(UI 표시)
	•	AssistantActionBar : 복사/다시생성/요약/팝업 열기
	•	AssistantEmptyState : 비어있을 때 안내
	•	AssistantPopup : 응답 상세 팝업(또는 새창)
	•	PopupPortal : 모달/팝업 포털
	•	(선택) AssistantRightPanel / AssistantSplitResizer : 우측 패널/리사이즈 핸들

2) Redux 도메인
	•	슬라이스 키: assistant
	•	상태 트리(실무형 최소)

assistant: {
  currentThreadId: null,
  requests: { byId: {}, order: [] },   // {requestId: {threadId, prompt, status, ...}}
  streaming: { isStreaming: false, byRequestId: {} }, // {reqId: {buffer, lastChunkAt}}
  responses: { byThreadId: {} },       // {threadId: [messageId, ...]}
  suggestions: [],                     // 자동완성/명령어
  ui: { rightPanelOpen: true, rightPanelWidth: 360, popups: {} } // {popupId: {open, meta}}
}

3) 액션 타입 (prefix assistant/)
	•	요청/스트림/완료
	•	assistant/SEND_REQUEST
	•	assistant/STREAM_ARRIVED
	•	assistant/COMPLETE_SUCCESS
	•	assistant/COMPLETE_FAILURE
	•	assistant/CANCEL_REQUEST
	•	assistant/RETRY_REQUEST
	•	제안/스레드/응답
	•	assistant/SET_SUGGESTIONS
	•	assistant/CLEAR_SUGGESTIONS
	•	assistant/SELECT_THREAD
	•	assistant/APPEND_BLOCKS          // 결과 블록 추가
	•	UI/팝업/패널/토스트
	•	assistant/OPEN_POPUP
	•	assistant/CLOSE_POPUP
	•	assistant/SET_RIGHT_PANEL_OPEN
	•	assistant/SET_RIGHT_PANEL_WIDTH
	•	assistant/SHOW_TOAST
	•	assistant/HIDE_TOAST

4) 액션 크리에이터 (이름만)

sendRequest({ threadId, prompt, attachments })
streamArrived({ requestId, delta })
completeSuccess({ requestId, message })
completeFailure({ requestId, error })
cancelRequest({ requestId })
retryRequest({ requestId })

setSuggestions({ list })
clearSuggestions()

selectAssistantThread({ threadId })
appendBlocks({ requestId, blocks })

openAssistantPopup({ popupId, meta })
closeAssistantPopup({ popupId })
setAssistantRightPanelOpen({ open })
setAssistantRightPanelWidth({ width })
assistantShowToast({ id, kind, text })
assistantHideToast({ id })


5) 셀렉터 (이름만)

selectAssistantState(state)
selectAssistantCurrentThreadId(state)
selectAssistantSuggestions(state)
selectAssistantIsStreaming(state)
selectAssistantStreamingByRequestId(state, requestId)
selectAssistantResponsesByThread(state, threadId)
selectAssistantRightPanelOpen(state)
selectAssistantRightPanelWidth(state)

6) 사가(와처/워커) & 소켓 이벤트
	•	사가
	•	watchSendAssistantRequest → workSendAssistantRequest
	•	watchCancelAssistantRequest
	•	watchRetryAssistantRequest
	•	watchAssistantStream (소켓 채널을 이벤트로 변환)
	•	watchCompleteAssistantRequest
	•	소켓 이벤트 네임
	•	outbound: assistant:request, assistant:cancel
	•	inbound : assistant:stream, assistant:complete, assistant:error

7) API 함수 (status/message/data 규약)
	•	파일: src/api/assistantApi.js
	•	postAssistantRequest({ threadId, prompt, attachments }) → {status, message, data}
	•	cancelAssistantRequest({ requestId }) → {status, message, data}


9) 폴더 구조(Assistant만)
src/
  components/
    assistant/
      AssistantView.js
      AssistantComposerContainer.js
      AssistantComposer.js
      AssistantCommandList.js
      AssistantAttachmentPicker.js
      AssistantResultPane.js
      AssistantResultBlock.js
      AssistantStreamingLine.js
      AssistantActionBar.js
      AssistantEmptyState.js
      AssistantPopup.js
      PopupPortal.js
      (옵션) AssistantRightPanel.js
      (옵션) AssistantSplitResizer.js
  redux/
    assistant/
      types.js
      actions.js
      reducer.js
      selectors.js
      sagas.js
  api/
    assistantApi.js
  styles/
    cube-assistant.css


export const SEND_REQUEST = 'assistant/SEND_REQUEST';
export const STREAM_ARRIVED = 'assistant/STREAM_ARRIVED';
export const COMPLETE_SUCCESS = 'assistant/COMPLETE_SUCCESS';
export const COMPLETE_FAILURE = 'assistant/COMPLETE_FAILURE';
export const CANCEL_REQUEST = 'assistant/CANCEL_REQUEST';
export const RETRY_REQUEST = 'assistant/RETRY_REQUEST';

export const SET_SUGGESTIONS = 'assistant/SET_SUGGESTIONS';
export const CLEAR_SUGGESTIONS = 'assistant/CLEAR_SUGGESTIONS';

export const SELECT_THREAD = 'assistant/SELECT_THREAD';
export const APPEND_BLOCKS = 'assistant/APPEND_BLOCKS';

export const OPEN_POPUP = 'assistant/OPEN_POPUP';
export const CLOSE_POPUP = 'assistant/CLOSE_POPUP';
export const SET_RIGHT_PANEL_OPEN = 'assistant/SET_RIGHT_PANEL_OPEN';
export const SET_RIGHT_PANEL_WIDTH = 'assistant/SET_RIGHT_PANEL_WIDTH';
export const SHOW_TOAST = 'assistant/SHOW_TOAST';
export const HIDE_TOAST = 'assistant/HIDE_TOAST';


