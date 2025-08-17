import api from './client';

export const createSearch = (keyword) =>
    api.post('/searches', null, { params: { keyword } });

export const fetchHistory = (cursor, size = 20) =>
    api.get('/searches', { params: { cursor, size } });

export const fetchResult = (queryId, fromSeq = null, size = 100) =>
    api.get(`/searches/${queryId}/result`, { params: { fromSeq, size } });
