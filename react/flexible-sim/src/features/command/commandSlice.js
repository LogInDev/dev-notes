import { resolveCommand } from '../../store/commandRegistry';

const INITIAL_STATE = {
    input: '',
    previewText: '',  // 입력창 위 프리뷰 메시지
    activeCmd: null,  // { cmd, args, def }
};

const SET_INPUT = 'command/SET_INPUT';
const SET_PREVIEW = 'command/SET_PREVIEW';
const CLEAR_PREVIEW = 'command/CLEAR_PREVIEW';
const EXECUTE = 'command/EXECUTE';

export const setInput = v => ({ type: SET_INPUT, payload: v });
export const setPreview = (text, activeCmd) => ({ type: SET_PREVIEW, payload: { text, activeCmd }});
export const clearPreview = () => ({ type: CLEAR_PREVIEW });
export const executeCommand = () => ({ type: EXECUTE });

export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case SET_INPUT:
            return { ...state, input: action.payload };
        case SET_PREVIEW:
            return { ...state, previewText: action.payload.text, activeCmd: action.payload.activeCmd };
        case CLEAR_PREVIEW:
            return { ...state, previewText: '', activeCmd: null };
        default:
            return state;
    }
}

// 입력값 변경 시 프리뷰 계산(컨테이너/컴포넌트에서 호출)
export const updatePreviewFromInput = (value) => (dispatch) => {
    const found = resolveCommand(value);
    if (!found) return dispatch(clearPreview());
    const text = found.def.preview(found.args);
    return dispatch(setPreview(text, found));
};

// 엔터 시 실행(컨테이너/컴포넌트에서 dispatch)
export const runCommandIfAny = () => (dispatch, getState) => {
    const { command } = getState();
    const found = command.activeCmd;
    if (!found) return false;
    found.def.handler(dispatch, found.args, command.input, getState);
    dispatch(clearPreview());
    dispatch(setInput(''));
    return true;
};
