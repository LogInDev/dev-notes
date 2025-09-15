import * as T from './actionTypes';

const baseColors = { background: '#fff', font: '#111' };

const initialState = {
    // 기존 전역 상태(필요 시 확장)
    query: '',
    queryId: '0',
    queryResult: '',
    color: baseColors,
    bottomMessageID: -1,
    topMessageID: -1,
    findMessageID: '-1',
    writting: [],
    list: [],
    linkedData: [],

    // 뷰 상태
    ui: {
        currentThreadId: null,  // 우측 패널에서 보고 있는 threadId
    },

    // 팝업들
    popups: {
        // popupId: { popupId, threadId }
    },

    // thread 저장소 (맵)
    threadList: {
        // [threadId]: { id, query, loading, openPopup, hasNext, contents: [] }
    }
};

function ensureThreadEntry(state, threadId) {
    const exist = state.threadList[threadId];
    if (exist) return exist;
    return {
        id: threadId,
        query: '',
        loading: false,
        openPopup: false,
        hasNext: false,
        contents: []
    };
}

export default function aiAssistant(state = initialState, action) {
    switch (action.type) {
        case T.AI_OPEN_THREAD_IN_PANEL: {
            const { threadId } = action.payload;
            const entry = ensureThreadEntry(state, threadId);
            return {
                ...state,
                ui: { ...state.ui, currentThreadId: threadId },
                threadList: {
                    ...state.threadList,
                    [threadId]: entry
                }
            };
        }

        case T.AI_EXECUTE_QUERY: {
            const { threadId, text } = action.payload;
            const entry = ensureThreadEntry(state, threadId);
            const userMsg = {
                messageId: `c_${Date.now()}`,
                role: 'user',
                content: text,
                ts: Date.now()
            };
            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: {
                        ...entry,
                        query: text,
                        loading: true,
                        contents: [...entry.contents, userMsg]
                    }
                }
            };
        }

        case T.AI_APPEND_MESSAGE: {
            const { threadId, message } = action.payload;
            const entry = ensureThreadEntry(state, threadId);

            // 중복 방지(메시지ID 기준)
            const exists = (entry.contents || []).some(m => m.messageId === message.messageId);
            const contents = exists ? entry.contents : [...entry.contents, message];

            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, contents }
                }
            };
        }

        case T.AI_SET_LOADING: {
            const { threadId, loading } = action.payload;
            const entry = ensureThreadEntry(state, threadId);
            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, loading: !!loading }
                }
            };
        }

        case T.AI_OPEN_POPUP: {
            const { threadId, openPopup } = action.payload;
            const entry = ensureThreadEntry(state, threadId);
            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, openPopup: !!openPopup }
                }
            };
        }

        case T.AI_MERGE_THREAD_META: {
            const { threadId, meta } = action.payload;
            const entry = ensureThreadEntry(state, threadId);
            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, ...meta }
                }
            };
        }

        default:
            return state;
    }
}

// 동작 요약
//
// 전송 클릭 → apihandler.aiSend({ text }, cb)
//
// 응답에서 threadId 즉시 획득
//
// ensureThreadListener(eventbus, threadId) 호출(중복 등록 방지)
//
// aiExecuteQuery({ threadId, text }) + aiSetLoading(threadId, true) → Optimistic UI
//
// 서버가 ai.thread.{threadId} 로 push → 리스너가 수신 → aiAppendMessage → 필요 시 aiSetLoading(false)
//
// 우측 패널/팝업은 동일 threadId를 보기 때문에 동시에 결과가 표시됨
//
// 실무 팁
//
// 중복 리스너 방지: aiListeners.js에서 _registered Set으로 보장
//
// 팝업 동기화: 팝업에도 동일한 Redux store와 Sock/ApiHandler를 주입(또는 postMessage 브리지)
//
// 스트리밍: 서버가 토큰 단위로 보낼 때 partial: true를 활용 → 마지막에 done: true로 로딩 off
//
// 에러 처리: aiSend 콜백 에러, registerHandler err에서 UI에 알림 추가