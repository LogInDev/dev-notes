import api from './client';

export const createSearch = (keyword) =>
    api.post('/searches', null, { params: { keyword } });

export const fetchHistory = (cursor, size = 20) =>
    api.get('/searches', { params: {
            size,
            // cursor는 { createdAt, id } 형태로 보냄
            cursorCreatedAt: cursor?.createdAt || undefined,
            cursorId: cursor?.id || undefined,
        } });

export const fetchResult = (queryId) =>
    api.get(`/searches/${queryId}/result/messages`);

export const fetchResultMessages = (queryId, cursorSeq, size = 100) =>
    api.get(`/searches/${queryId}/result/messages`, {
    params: { size, cursorSeq: cursorSeq ?? undefined },
});