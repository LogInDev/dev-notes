import * as ActionTypes from './actionTypes';

const baseColors = {
    background : '#fff',
    font: '#111',
};

// 공용: thread 엔트리 생성/머지
function ensureThreadEntry(state, threadId) {
    const exist = state.threadList[threadId];
    if (exist) return exist;

    return {
        id: threadId,
        query: '',
        openPopup: false,
        loading: false,
        hasNext: false,
        contents: []
    };
}

const initialState = {
    query: '',
    queryId: '0',
    queryResult: '',
    color: baseColors,
    bottomMessageID: -1,
    topMessageID: -1,
    findMessageID: '-1',
    writting: [],
    list: [],        // (필요 시) 스레드 목록용
    linkedData: [],

    // 우측 패널 UI 상태
    ui: {
        currentThreadId: null,  // 좌측 클릭 시 열리는 스레드
    },

    // 팝업 관리(여러 개)
    popups: {
        // popupId: { popupId, threadId }
    },

    // 스레드 저장소(맵)
    threadList: {
        // 'threadId_1212': { id, query, openPopup, loading, hasNext, contents: [...] }
    }
};

export default function aiAssistant(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.EXECUTE_SEARCH: {
            const query = (action.query || '').trim();
            if (!query) return state;
            return { ...state, query };
        }

        case ActionTypes.SET_AIVIEW_COLOR: {
            const color = action.color;
            if (!color) return state;
            return { ...state, color };
        }

        case ActionTypes.SET_QUERY_ID: {
            const queryId = action.query_id;
            if (!queryId) return state;
            return { ...state, queryId };
        }

        case ActionTypes.OPEN_THREAD_IN_PANEL: {
            const { threadId } = action.payload;
            // 우측 패널 현재 스레드 설정
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

        case ActionTypes.OPEN_THREAD_POPUP: {
            const { threadId } = action.payload;
            const entry = ensureThreadEntry(state, threadId);
            const popupId = 'popup_' + Date.now();
            return {
                ...state,
                popups: {
                    ...state.popups,
                    [popupId]: { popupId, threadId }
                },
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, openPopup: true }
                }
            };
        }

        case ActionTypes.CLOSE_THREAD_POPUP: {
            const { popupId } = action.payload;
            if (!state.popups[popupId]) return state;
            const { threadId } = state.popups[popupId];
            const newPopups = { ...state.popups };
            delete newPopups[popupId];

            // 동일 스레드를 띄운 팝업이 더 남아있는지 확인
            const stillOpen = Object.values(newPopups).some(p => p.threadId === threadId);
            const entry = ensureThreadEntry(state, threadId);

            return {
                ...state,
                popups: newPopups,
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, openPopup: stillOpen }
                }
            };
        }

        case ActionTypes.SET_THREAD_LOADING: {
            const { threadId, tempId, loading } = action.payload;
            const key = threadId || tempId;
            if (!key) return state;
            const entry = ensureThreadEntry(state, key);

            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [key]: { ...entry, loading: !!loading }
                }
            };
        }

        case ActionTypes.UPSERT_THREAD: {
            const { thread } = action.payload; // { id, ...partial }
            if (!thread || !thread.id) return state;
            const prev = ensureThreadEntry(state, thread.id);
            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [thread.id]: { ...prev, ...thread }
                }
            };
        }

        case ActionTypes.APPEND_MESSAGES: {
            const { threadId, messages } = action.payload;
            if (!threadId || !Array.isArray(messages)) return state;
            const entry = ensureThreadEntry(state, threadId);

            // 중복 방지: messageId 기준
            const existingIds = new Set((entry.contents || []).map(m => m.messageId));
            const merged = [
                ...entry.contents,
                ...messages.filter(m => !existingIds.has(m.messageId))
            ];

            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: { ...entry, contents: merged, loading: false }
                }
            };
        }

        case ActionTypes.SET_SCROLL_ANCHORS: {
            const { topMessageID, bottomMessageID, findMessageID } = action.payload;
            return {
                ...state,
                topMessageID: typeof topMessageID === 'number' ? topMessageID : state.topMessageID,
                bottomMessageID: typeof bottomMessageID === 'number' ? bottomMessageID : state.bottomMessageID,
                findMessageID: (findMessageID != null ? String(findMessageID) : state.findMessageID)
            };
        }

        case ActionTypes.CREATE_TEMP_THREAD: {
            const { tempId } = action.payload;
            if (!tempId) return state;
            const entry = ensureThreadEntry(state, tempId);
            return {
                ...state,
                ui: { ...state.ui, currentThreadId: tempId },
                threadList: {
                    ...state.threadList,
                    [tempId]: { ...entry, id: tempId, loading: false, contents: [] }
                }
            };
        }

        case ActionTypes.REPLACE_TEMP_THREAD_ID: {
            const { tempId, threadId } = action.payload || {};
            if (!tempId || !threadId) return state;
            const tempEntry = state.threadList[tempId];
            if (!tempEntry) return state;

            const moved = {
                ...tempEntry,
                id: threadId
            };

            // 모든 팝업 중 tempId를 쓰던 항목을 threadId로 치환
            const newPopups = Object.fromEntries(
                Object.values(state.popups).map(p => {
                    const updated = (p.threadId === tempId) ? { ...p, threadId } : p;
                    return [updated.popupId, updated];
                })
            );

            // currentThreadId도 치환
            const newCurrent =
                state.ui.currentThreadId === tempId ? threadId : state.ui.currentThreadId;

            // 새 맵 구성
            const newThreadList = { ...state.threadList };
            delete newThreadList[tempId];
            newThreadList[threadId] = moved;

            return {
                ...state,
                ui: { ...state.ui, currentThreadId: newCurrent },
                popups: newPopups,
                threadList: newThreadList
            };
        }

        case ActionTypes.RECEIVE_MESSAGE: {
            const msg = action.payload;
            const threadId = msg.threadId;
            if (!threadId) return state;

            const entry = ensureThreadEntry(state, threadId);
            const exists = (entry.contents || []).some(m => m.messageId === msg.messageId);
            if (exists) return state;

            return {
                ...state,
                threadList: {
                    ...state.threadList,
                    [threadId]: {
                        ...entry,
                        loading: false,
                        contents: [...entry.contents, msg]
                    }
                }
            };
        }

        default:
            return state;
    }
}
