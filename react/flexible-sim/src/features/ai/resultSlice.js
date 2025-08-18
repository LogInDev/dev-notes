// 상태: 현재 선택된 쿼리의 결과
const INITIAL_STATE = {
    currentQueryId: null,
    messages: [],
    loading: false,
    error: null,
};

// actions types
export default function result(state=INITIAL_STATE, action){
    switch(action.type){
        case 'result/SET_QUERY': return { ...state, currentQueryId: action.queryId, messages:[] };
        case 'result/REQ': return { ...state, loading:true };
        case 'result/SUCC': return { ...state, loading:false, messages:[...state.messages, ...action.payload.messages] };
        case 'result/FAIL': return { ...state, loading:false, error: action.error || 'fail' };
        default: return state;
    }
}