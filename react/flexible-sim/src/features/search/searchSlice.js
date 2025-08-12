import { getInitialRecents } from '../../store/middlewares/persistRecentSearches';

const MAX_RECENTS = 10;

const INITIAL_STATE = {
    query: '',
    recents: getInitialRecents(), // 로컬스토리지에서 복구
    isOpenDropdown: false,
};

const SET_QUERY = 'search/SET_QUERY';
const ADD_RECENT = 'search/ADD_RECENT';
const CLEAR_RECENTS = 'search/CLEAR_RECENTS';
const SET_DROPDOWN_OPEN = 'search/SET_DROPDOWN_OPEN';

export const setQuery = q => ({ type: SET_QUERY, payload: q });
export const addRecent = q => ({ type: ADD_RECENT, payload: q });
export const clearRecents = () => ({ type: CLEAR_RECENTS });
export const setDropdownOpen = open => ({ type: SET_DROPDOWN_OPEN, payload: open });

// 외부에서 호출할 검색 실행 액션(Thunk 없이 단순 시그널)
const EXECUTE_SEARCH = 'search/EXECUTE_SEARCH';
export const executeSearch = q => ({ type: EXECUTE_SEARCH, payload: q });
export const EXECUTE_SEARCH_TYPE = EXECUTE_SEARCH;

export default function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case SET_QUERY:
            return { ...state, query: action.payload };
        case SET_DROPDOWN_OPEN:
            return { ...state, isOpenDropdown: action.payload };
        case ADD_RECENT: {
            const q = (action.payload || '').trim();
            if (!q) return state;
            const next = [q, ...state.recents.filter(v => v !== q)].slice(0, MAX_RECENTS);
            return { ...state, recents: next };
        }
        case CLEAR_RECENTS:
            return { ...state, recents: [] };
        default:
            return state;
    }
}
