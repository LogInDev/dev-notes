// 상태: 상단 탭/좌측 탭
const INITIAL_STATE = {
    activeTab: 'chat',
    tabs: [
        { key: 'chat', label: '채팅' },
        { key: 'notice', label: '공지' },
        { key: 'files', label: '파일' },
    ],
    activeLeftTab: 'ai',
};

// actions types
export const SET_ACTIVE_TAB = 'ui/SET_ACTIVE_TAB';
export const SET_LEFT_TAB   = 'ui/SET_LEFT_TAB';

// actions creators
export const setActiveTab = (key) => ({ type: SET_ACTIVE_TAB, payload: key });
export const setLeftTab   = (tab) => ({ type: SET_LEFT_TAB, tab });

export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case SET_ACTIVE_TAB:
            return { ...state, activeTab: action.payload };
        case SET_LEFT_TAB:
            return { ...state, activeLeftTab: action.tab };
        default:
            return state;
    }
}
