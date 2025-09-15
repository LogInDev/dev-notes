import { SEND_AI_QUERY, RECEIVE_AI_RESPONSE, SET_LOADING } from '../actions/ai';

const initialState = {
  loading: false,
  messages: [],
  threadId: null,
};

export default function aiReducer(state = initialState, action) {
  switch (action.type) {
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SEND_AI_QUERY:
      return {
        ...state,
        threadId: action.payload.threadId || state.threadId, // 없으면 유지
      };
    case RECEIVE_AI_RESPONSE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    default:
      return state;
  }
}