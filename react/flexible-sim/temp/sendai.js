import socket from '../socket';

export const SEND_AI_QUERY = 'SEND_AI_QUERY';
export const RECEIVE_AI_RESPONSE = 'RECEIVE_AI_RESPONSE';
export const SET_LOADING = 'SET_LOADING';

export const sendAIQuery = ({ query, threadId = null }) => {
  return (dispatch) => {
    dispatch({ type: SET_LOADING, payload: true });

    const payload = threadId
      ? { query, threadId }
      : { query }; // 새 thread면 ID 없음

    socket.emit('AI_QUERY', payload);

    // 응답은 한 번만 바인딩
    socket.once('AI_RESPONSE', (data) => {
      dispatch({ type: RECEIVE_AI_RESPONSE, payload: data });
      dispatch({ type: SET_LOADING, payload: false });
    });

    dispatch({
      type: SEND_AI_QUERY,
      payload,
    });
  };
};




