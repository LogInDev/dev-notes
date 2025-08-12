// slash 명령어 레지스트리: 실무에선 이곳에서 핸들러 연결
// handler는 (dispatch, argsText, fullText, getState) => void
const registry = {
    '/gpt': {
        desc: 'AI에게 질문을 보냅니다. 예) /gpt 요약해줘',
        preview: args => `AI에게 전송: "${args || '(내용 없음)'}"`,
        handler: (dispatch, args) => {
            dispatch({ type: 'command/EXEC_GPT', payload: { prompt: args || '' } });
        },
    },
    '/poll': {
        desc: '투표 생성. 예) /poll 점심 뭐먹지? | 김치찌개 | 비빔밥',
        preview: args => `투표 생성 미리보기: ${args}`,
        handler: (dispatch, args) => {
            dispatch({ type: 'command/EXEC_POLL_CREATE', payload: { text: args } });
        },
    },
    '/remind': {
        desc: '리마인드 설정. 예) /remind 15m 문서 보내기',
        preview: args => `리마인드 예약: ${args}`,
        handler: (dispatch, args) => {
            dispatch({ type: 'command/EXEC_REMIND', payload: { text: args } });
        },
    },
};

export default registry;
export const resolveCommand = (text) => {
    if (!text || text[0] !== '/') return null;
    const [cmd, ...rest] = text.trim().split(' ');
    const def = registry[cmd];
    if (!def) return null;
    return { cmd, args: rest.join(' ').trim(), def };
};
