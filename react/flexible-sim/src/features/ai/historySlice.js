// 상태: 좌측 히스토리(무한 스크롤)
const INITIAL_STATE = {
    items: [],
    cursor: null,
    loading: false,
    error: null,
};

// actions types
export const REQ  = 'history/REQ';
export const SUCC = 'history/SUCC';
export const FAIL = 'history/FAIL';
export const RESET = 'history/RESET'; // (옵션) 탭 전환 등 초기화에 사용

export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case REQ:
            return { ...state, loading: true, error: null };

        case SUCC:
            return {
                ...state,
                loading: false,
                items: [...state.items, ...(action.payload?.items || [])],
                cursor: action.payload?.nextCursor ?? null,
            };

        case FAIL:
            return { ...state, loading: false, error: action.error || 'error' };

        case RESET:
            return INITIAL_STATE;

        default:
            return state;
    }
}
