// 상태: 활성 탭과 탭 목록
const INITIAL_STATE = {
    activeTab: 'chat',
    tabs: [
        { key: 'chat', label: '채팅' },
        { key: 'notice', label: '공지' },
        { key: 'files', label: '파일' },
    ],
};

// actions
const SET_ACTIVE_TAB = 'ui/SET_ACTIVE_TAB';

export const setActiveTab = key => ({ type: SET_ACTIVE_TAB, payload: key });

// reducer
export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case SET_ACTIVE_TAB:
            return { ...state, activeTab: action.payload };
        default:
            return state;
    }
}
