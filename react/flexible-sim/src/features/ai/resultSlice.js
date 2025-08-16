// 상태: 현재 선택된 쿼리의 결과
const INITIAL_STATE = {
    currentQueryId: null,
    messages: [],
    loading: false,
    error: null,
};

// actions types
export const SET_QUERY = 'result/SET_QUERY';
export const REQ       = 'result/REQ';
export const SUCC      = 'result/SUCC';
export const FAIL      = 'result/FAIL';

// actions creators (동기)
export const setQuery = (queryId) => ({ type: SET_QUERY, queryId });

export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case SET_QUERY:
            // 새 쿼리 선택 시 메시지 초기화
            return { ...state, currentQueryId: action.queryId, messages: [], error: null };

        case REQ:
            return { ...state, loading: true, error: null };

        case SUCC: {
            // api 미들웨어가 { queryId?, messages:[] } 형태의 payload를 넣는다고 가정
            const payload = action.payload || {};
            const nextMessages = [...state.messages, ...(payload.messages || [])];
            return {
                ...state,
                loading: false,
                currentQueryId: payload.queryId ?? state.currentQueryId,
                messages: nextMessages,
            };
        }

        case FAIL:
            return { ...state, loading: false, error: action.error || 'error' };

        default:
            return state;
    }
}
