# Redux 상태 설계 (assistant 슬라이스, 팝업 전용)

```js
// state.assistant
{
  // 팝업 메타(열림, 포커스, 위치/크기)
  windows: {
    byId: {
      // popupId 예: "win_1737000123456"
      [popupId]: {
        open: true,
        focused: true,
        title: 'AI Assistant',
        bounds: { left: 100, top: 80, width: 900, height: 700 },
        threadId: 'th_123',        // 이 창이 바라보는 스레드
        contextId: 'window:win_1737000123456'
      }
    },
    order: [popupId, ...]          // z-index / 최근순
  },

  // 창별(=contextId별) 뷰 상태: 요청/스트림/검색/로컬UI
  contexts: {
    // key = contextId = `window:${popupId}`
    'window:win_1737000123456': {
      threadId: 'th_123',          // 창 내부에서 스레드 전환해도 독립
      requests: {
        byId: {
          // requestId: { threadId, prompt, status: 'running|success|failure', startedAt, finishedAt, error? }
        },
        order: []                  // 최신 요청 우선
      },
      streaming: {
        isStreaming: false,
        byRequestId: {
          // requestId: { buffer: '수신 누적 텍스트', lastChunkAt }
        }
      },
      search: {
        query: '',
        results: [],               // messageId[] 또는 결과 객체들
        nextCursor: null,
        loading: false
      },
      ui: {
        draft: '',                 // 입력창 텍스트(이 창 전용)
        attachments: []            // 첨부(이 창 전용)
      }
    }
    // ...다른 창들
  },

  // requestId → 어느 창(context)로 보낼지 역참조
  requestContextMap: {
    // requestId: { contextId: 'window:...', threadId: 'th_...' }
  }
}
```

---

# 액션 설계 (타입 & 페이로드)

## 1) 창 생명주기 / 포커스 / 위치
```js
// 열기/닫기
assistant/OPEN_WINDOW            payload: { popupId, threadId, title?, bounds? }
assistant/CLOSE_WINDOW           payload: { popupId }

// 포커스/순서
assistant/FOCUS_WINDOW           payload: { popupId }           // order 맨 앞으로
assistant/BLUR_WINDOW            payload: { popupId }

// 위치/크기 업데이트(옵션)
assistant/SET_WINDOW_BOUNDS      payload: { popupId, bounds: { left?, top?, width?, height? } }

// 창이 바라보는 thread 전환(팝업 내부에서 다른 스레드 보기)
assistant/SET_WINDOW_THREAD      payload: { popupId, threadId }
```

## 2) 창별 입력/UI(로컬 상태)
```js
assistant/SET_DRAFT              payload: { contextId, value }
assistant/ADD_ATTACHMENT         payload: { contextId, file }          // {id,name,size,type,url?}
assistant/REMOVE_ATTACHMENT      payload: { contextId, fileId }
assistant/CLEAR_COMPOSER         payload: { contextId }                 // draft/attachments 초기화
```

## 3) 창별 AI 요청/스트리밍/완료
```js
assistant/SEND_REQUEST           payload: { contextId, requestId, threadId, prompt, attachments }
assistant/STREAM_ARRIVED         payload: { contextId, requestId, delta }
assistant/COMPLETE_SUCCESS       payload: { contextId, requestId, message } // message.id, message.threadId 포함
assistant/COMPLETE_FAILURE       payload: { contextId, requestId, error }
assistant/CANCEL_REQUEST         payload: { contextId, requestId }
assistant/RETRY_REQUEST          payload: { contextId, requestId }     // 이전 prompt 재전송
```

## 4) 창별 검색(팝업 내부 전용)
```js
assistant/UPDATE_SEARCH_QUERY    payload: { contextId, query }
assistant/FETCH_SEARCH_RESULTS   payload: { contextId, threadId, query, cursor }
assistant/SET_SEARCH_RESULTS     payload: { contextId, items, nextCursor }
assistant/APPEND_SEARCH_RESULTS  payload: { contextId, items, nextCursor }
assistant/CLEAR_SEARCH           payload: { contextId }
```

---

# 타입 상수 (types.js)

```js
// windows
export const OPEN_WINDOW = 'assistant/OPEN_WINDOW';
export const CLOSE_WINDOW = 'assistant/CLOSE_WINDOW';
export const FOCUS_WINDOW = 'assistant/FOCUS_WINDOW';
export const BLUR_WINDOW = 'assistant/BLUR_WINDOW';
export const SET_WINDOW_BOUNDS = 'assistant/SET_WINDOW_BOUNDS';
export const SET_WINDOW_THREAD = 'assistant/SET_WINDOW_THREAD';

// ui (composer)
export const SET_DRAFT = 'assistant/SET_DRAFT';
export const ADD_ATTACHMENT = 'assistant/ADD_ATTACHMENT';
export const REMOVE_ATTACHMENT = 'assistant/REMOVE_ATTACHMENT';
export const CLEAR_COMPOSER = 'assistant/CLEAR_COMPOSER';

// requests/stream
export const SEND_REQUEST = 'assistant/SEND_REQUEST';
export const STREAM_ARRIVED = 'assistant/STREAM_ARRIVED';
export const COMPLETE_SUCCESS = 'assistant/COMPLETE_SUCCESS';
export const COMPLETE_FAILURE = 'assistant/COMPLETE_FAILURE';
export const CANCEL_REQUEST = 'assistant/CANCEL_REQUEST';
export const RETRY_REQUEST = 'assistant/RETRY_REQUEST';

// search
export const UPDATE_SEARCH_QUERY = 'assistant/UPDATE_SEARCH_QUERY';
export const FETCH_SEARCH_RESULTS = 'assistant/FETCH_SEARCH_RESULTS';
export const SET_SEARCH_RESULTS = 'assistant/SET_SEARCH_RESULTS';
export const APPEND_SEARCH_RESULTS = 'assistant/APPEND_SEARCH_RESULTS';
export const CLEAR_SEARCH = 'assistant/CLEAR_SEARCH';
```

---

# 액션 크리에이터 (actions.js)

```js
import * as T from './types';

// windows
export const openWindow = ({ popupId, threadId, title, bounds }) =>
  ({ type: T.OPEN_WINDOW, payload: { popupId, threadId, title, bounds } });

export const closeWindow = ({ popupId }) =>
  ({ type: T.CLOSE_WINDOW, payload: { popupId } });

export const focusWindow = ({ popupId }) =>
  ({ type: T.FOCUS_WINDOW, payload: { popupId } });

export const blurWindow = ({ popupId }) =>
  ({ type: T.BLUR_WINDOW, payload: { popupId } });

export const setWindowBounds = ({ popupId, bounds }) =>
  ({ type: T.SET_WINDOW_BOUNDS, payload: { popupId, bounds } });

export const setWindowThread = ({ popupId, threadId }) =>
  ({ type: T.SET_WINDOW_THREAD, payload: { popupId, threadId } });

// ui (composer)
export const setDraft = ({ contextId, value }) =>
  ({ type: T.SET_DRAFT, payload: { contextId, value } });

export const addAttachment = ({ contextId, file }) =>
  ({ type: T.ADD_ATTACHMENT, payload: { contextId, file } });

export const removeAttachment = ({ contextId, fileId }) =>
  ({ type: T.REMOVE_ATTACHMENT, payload: { contextId, fileId } });

export const clearComposer = ({ contextId }) =>
  ({ type: T.CLEAR_COMPOSER, payload: { contextId } });

// requests/stream
export const sendRequest = ({ contextId, requestId, threadId, prompt, attachments }) =>
  ({ type: T.SEND_REQUEST, payload: { contextId, requestId, threadId, prompt, attachments } });

export const streamArrived = ({ contextId, requestId, delta }) =>
  ({ type: T.STREAM_ARRIVED, payload: { contextId, requestId, delta } });

export const completeSuccess = ({ contextId, requestId, message }) =>
  ({ type: T.COMPLETE_SUCCESS, payload: { contextId, requestId, message } });

export const completeFailure = ({ contextId, requestId, error }) =>
  ({ type: T.COMPLETE_FAILURE, payload: { contextId, requestId, error } });

export const cancelRequest = ({ contextId, requestId }) =>
  ({ type: T.CANCEL_REQUEST, payload: { contextId, requestId } });

export const retryRequest = ({ contextId, requestId }) =>
  ({ type: T.RETRY_REQUEST, payload: { contextId, requestId } });

// search
export const updateSearchQuery = ({ contextId, query }) =>
  ({ type: T.UPDATE_SEARCH_QUERY, payload: { contextId, query } });

export const fetchSearchResults = ({ contextId, threadId, query, cursor }) =>
  ({ type: T.FETCH_SEARCH_RESULTS, payload: { contextId, threadId, query, cursor } });

export const setSearchResults = ({ contextId, items, nextCursor }) =>
  ({ type: T.SET_SEARCH_RESULTS, payload: { contextId, items, nextCursor } });

export const appendSearchResults = ({ contextId, items, nextCursor }) =>
  ({ type: T.APPEND_SEARCH_RESULTS, payload: { contextId, items, nextCursor } });

export const clearSearch = ({ contextId }) =>
  ({ type: T.CLEAR_SEARCH, payload: { contextId } });
```

---

# 포인트 요약
- **contextId = `window:${popupId}`** 를 모든 액션에 포함 → 창마다 완전 독립.
- **`windows.byId`**: 창의 메타(열림/위치/크기/포커스/타이틀/스레드).
- **`contexts[contextId]`**: 그 창의 **뷰 상태**(draft/attachments/requests/stream/search).
- **`requestContextMap`**: 소켓 수신 시 requestId로 원래 창을 찾아 라우팅.
