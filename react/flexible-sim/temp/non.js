// aiAssistant/reducer.js
import * as T from './types';

const initialState = /* 위 0)과 동일 */;

function renameKey(obj, oldKey, newKey) {
  if (oldKey === newKey || !obj[oldKey]) return obj;
  const { [oldKey]: oldVal, ...rest } = obj;
  return { ...rest, [newKey]: { ...oldVal } };
}

export default function aiAssistant(state = initialState, action) {
  switch (action.type) {

    case T.AI_SEND_COMMAND_START: {
      const { tempId, initThread } = action;
      if (state.threadList[tempId]) return state;
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [tempId]: { ...initThread }
        }
      };
    }

    case T.AI_RENAME_THREAD_KEY: {
      const { tempId, realId } = action;
      // 키를 바꾸되, 만약 realId가 이미 존재하면 내용 합쳐줌(경합 방지)
      const tempEntry = state.threadList[tempId];
      if (!tempEntry) return state;

      const realEntry = state.threadList[realId] || {
        query: '',
        openPopup: false,
        loading: false,
        hasNext: false,
        contents: []
      };

      const merged = {
        ...realEntry,
        // temp에 쌓인 것 우선 반영
        contents: (realEntry.contents || []).concat(tempEntry.contents || []),
        loading: true // 서버 응답을 곧 받으니 로딩 유지
      };

      // oldKey 제거 + newKey에 병합 저장
      const renamed = renameKey(state.threadList, tempId, realId);
      return {
        ...state,
        threadList: {
          ...renamed,
          [realId]: merged
        }
      };
    }

    case T.AI_SEND_COMMAND_SUCCESS: {
      const { realThreadId, items, hasNext } = action;
      const cur = state.threadList[realThreadId] || {
        query: '',
        openPopup: false,
        loading: false,
        hasNext: false,
        contents: []
      };
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [realThreadId]: {
            ...cur,
            loading: false,
            hasNext: !!hasNext,
            // 봇 응답 붙이기
            contents: (cur.contents || []).concat(
              items.map((it) => ({
                messageId: it.id || `s_${Date.now()}_${Math.random()}`,
                context: it.text || it.context || '',
                register_name: it.senderName || 'cubeChatBot',
                register_uniquename: it.senderId || 'BOT001',
                role: it.role || 'assistant',
                ts: it.ts || Date.now()
              }))
            )
          }
        }
      };
    }

    case T.AI_SEND_COMMAND_ERROR: {
      const { tempId, error } = action;
      // tempId 엔트리에 에러 메시지를 붙여 사용자에게 보여준다.
      const cur = state.threadList[tempId];
      if (!cur) return state;
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [tempId]: {
            ...cur,
            loading: false,
            contents: cur.contents.concat({
              messageId: `err_${Date.now()}`,
              context: `요청 실패: ${error}`,
              register_name: 'system',
              register_uniquename: 'SYS',
              role: 'system',
              ts: Date.now()
            })
          }
        }
      };
    }

    case T.AI_APPEND_MESSAGE: {
      const { threadId, message } = action;
      const cur = state.threadList[threadId] || {
        query: '',
        openPopup: false,
        loading: false,
        hasNext: false,
        contents: []
      };
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [threadId]: { ...cur, contents: (cur.contents || []).concat(message) }
        }
      };
    }

    case T.AI_SET_LOADING: {
      const { threadId, loading } = action;
      const cur = state.threadList[threadId];
      if (!cur) return state;
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [threadId]: { ...cur, loading }
        }
      };
    }

    case T.AI_OPEN_POPUP: {
      const cur = state.threadList[action.threadId];
      if (!cur) return state;
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [action.threadId]: { ...cur, openPopup: true }
        }
      };
    }

    case T.AI_CLOSE_POPUP: {
      const cur = state.threadList[action.threadId];
      if (!cur) return state;
      return {
        ...state,
        threadList: {
          ...state.threadList,
          [action.threadId]: { ...cur, openPopup: false }
        }
      };
    }

    default:
      return state;
  }
}