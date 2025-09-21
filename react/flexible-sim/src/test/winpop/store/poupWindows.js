// store/popupWindows.js
const OPEN_POPUP = 'popup/OPEN';
const CLOSE_POPUP = 'popup/CLOSE';
const REGISTER_POPUP_WIN = 'popup/REGISTER_WIN'; // window 객체 보관 (복사/스크롤 용)

export const openPopup = (id, payload = {}) => ({ type: OPEN_POPUP, id, payload });
export const closePopup = (id) => ({ type: CLOSE_POPUP, id });
export const registerPopupWin = (id, win) => ({ type: REGISTER_POPUP_WIN, id, win });

const initial = {
    // { [id]: { id, payload, win } }
    items: {}
};

export default function reducer(state = initial, action) {
    switch (action.type) {
        case OPEN_POPUP: {
            const { id, payload } = action;
            return {
                ...state,
                items: {
                    ...state.items,
                    [id]: { id, payload, win: state.items[id]?.win || null }
                }
            };
        }
        case REGISTER_POPUP_WIN: {
            const { id, win } = action;
            if (!state.items[id]) return state;
            return {
                ...state,
                items: { ...state.items, [id]: { ...state.items[id], win } }
            };
        }
        case CLOSE_POPUP: {
            const { [action.id]: removed, ...rest } = state.items;
            // 창 닫기 시도 (안전)
            try { removed?.win && !removed.win.closed && removed.win.close(); } catch(e){}
            return { ...state, items: rest };
        }
        default:
            return state;
    }
}
