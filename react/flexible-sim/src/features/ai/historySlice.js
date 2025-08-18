// 상태: 좌측 히스토리(무한 스크롤)
const INITIAL_STATE = {
    items: [],
    cursor: null,
    loading: false,
    error: null,
};

// actions types
export default function history(state=INITIAL_STATE, action){
    switch(action.type){
        case 'history/REQ': return { ...state, loading:true };
        case 'history/SUCC': return {
            ...state, loading:false,
            items: [...state.items, ...(action.payload.items||[])],
            cursor: action.payload.nextCursor || null
        };
        case 'history/FAIL': return { ...state, loading:false, error: action.error || 'fail' };
        default: return state;
    }
}
