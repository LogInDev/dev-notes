import { createSearch, fetchHistory, fetchResult, fetchResultMessages } from '../../api/searchApi';

const pickHistory = (raw) => {
    const d = raw?.data?.data || raw?.data || raw || {};
    return {
        items: d.items || [],
        nextCursor: d.nextCursor || null
    };
};

const pickResult = (raw) => {
    const d = raw?.data?.data || raw?.data || raw || {};
    return {
        messages: (d.messages || []).map(m => ({ id:m.id, seq:m.seq, text:m.text, role:m.role }))
    };
};

export const loadHistory = () => ({
    types: ['history/REQ','history/SUCC','history/FAIL'],
    condition: (get) => get().history.loading === true,
    call: async (get) => {
        const { cursor } = get().history; // { createdAt, id } | null
        const res = await fetchHistory(cursor);
        const d = res.data?.data || {};
        return {
            items: d.items || [],
            nextCursor:
                d.nextCursorCreatedAt && d.nextCursorId
                    ? {createdAt: d.nextCursorCreatedAt, id: d.nextCursorId}
                    : null,
        };
    },
});

export const loadResult = (queryId) => ({
    types: ['result/REQ','result/SUCC','result/FAIL'],
    call: async () => {
        const res = await fetchResult(queryId);
        const { messages } = pickResult(res);
        return { queryId, messages };
    }
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

// RIGHT: (필요 시) 메시지 무한 스크롤
export const loadMoreMessages = (queryId) => ({
    types: ['result/REQ','result/SUCC','result/FAIL'],
    call: async (get) => {
        const lastSeq = get().result.nextCursorSeq ?? null;
                        const res = await fetchResultMessages(queryId, lastSeq);
        const d = res.data?.data || {};
        return {
            queryId,
            messages: (d.messages || []).map(m => ({
                id: m.id, seq: m.seq, role: m.role, text: m.text,
            })),
            nextCursorSeq: d.nextCursorSeq ?? null,
            };
    },
});