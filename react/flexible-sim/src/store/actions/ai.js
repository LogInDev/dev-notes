import { createSearch, fetchHistory, fetchResult } from '../../api/searchApi';

// 좌측 히스토리 무한 스크롤
export const loadHistory = () => ({
    types: ['history/REQ', 'history/SUCC', 'history/FAIL'],
    call: async (getState) => {
        const { cursor, loading } = getState().history;
        if (loading) return { items: [], nextCursor: cursor };
        const { data } = await fetchHistory(cursor);
        const payload = data?.data || {};
        return { items: payload.items || [], nextCursor: payload.nextCursor || null };
    },
});

// 히스토리 아이템 클릭 → 결과 로딩
export const loadResult = (queryId) => ({
    types: ['result/REQ', 'result/SUCC', 'result/FAIL'],
    call: async (_getState, dispatch) => {
        dispatch({ type: 'result/SET_QUERY', queryId }); // 메시지 초기화
        const { data } = await fetchResult(queryId, null, 100);
        const payload = data?.data || {};
        return { queryId, messages: payload.messages || [] };
    },
});

// 헤더 검색 제출(POST → 결과 조회)
export const submitSearch = (keyword) => ({
    types: ['result/REQ', 'result/SUCC', 'result/FAIL'],
    meta: { keyword },
    call: async (_getState, dispatch) => {
        const created = await createSearch(keyword);
        const queryId = created?.data?.data;
        dispatch({ type: 'result/SET_QUERY', queryId });
        const res = await fetchResult(queryId, null, 100);
        const payload = res?.data?.data || {};
        return { queryId, messages: payload.messages || [] };
    },
});
