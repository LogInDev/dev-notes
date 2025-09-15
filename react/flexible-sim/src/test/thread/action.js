// 스레드/메시지/로딩 관련 액션들
export const AI_EXECUTE_QUERY     = 'AI/EXECUTE_QUERY';
export const AI_APPEND_MESSAGE    = 'AI/APPEND_MESSAGE';
export const AI_SET_LOADING       = 'AI/SET_LOADING';
export const AI_OPEN_POPUP        = 'AI/OPEN_POPUP';
export const AI_MERGE_THREAD_META = 'AI/MERGE_THREAD_META';
export const AI_OPEN_THREAD_IN_PANEL = 'AI/OPEN_THREAD_IN_PANEL';


import * as T from './actionTypes';

export const aiExecuteQuery = ({ threadId, text }) => ({
  type: T.AI_EXECUTE_QUERY,
  payload: { threadId, text }
});

export const aiAppendMessage = (threadId, message) => ({
  type: T.AI_APPEND_MESSAGE,
  payload: { threadId, message }
});

export const aiSetLoading = (threadId, loading) => ({
  type: T.AI_SET_LOADING,
  payload: { threadId, loading }
});

export const aiOpenPopup = (threadId, openPopup) => ({
  type: T.AI_OPEN_POPUP,
  payload: { threadId, openPopup }
});

export const aiMergeThreadMeta = (threadId, meta) => ({
  type: T.AI_MERGE_THREAD_META,
  payload: { threadId, meta }
});

export const aiOpenThreadInPanel = (threadId) => ({
  type: T.AI_OPEN_THREAD_IN_PANEL,
  payload: { threadId }
});