const KEY = 'cube_recent_searches_v1';

const persistRecentSearches = store => next => action => {
    const result = next(action);

    if (action.type === 'search/ADD_RECENT' || action.type === 'search/CLEAR_RECENTS') {
        const state = store.getState();
        try {
            localStorage.setItem(KEY, JSON.stringify(state.search.recents));
        } catch (e) { /* storage quota 무시 */ }
    }
    return result;
};

export default persistRecentSearches;

// 초기 로딩 시 외부에서 사용: getInitialRecents()
export const getInitialRecents = () => {
    try {
        const raw = localStorage.getItem('cube_recent_searches_v1');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};
