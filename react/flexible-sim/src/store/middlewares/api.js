const api = ({ dispatch, getState }) => (next) => async (action) => {
    if (!action || !action.types || !action.call) return next(action);

    // ✅ REQ 이전에 스킵 조건 검사
    if (typeof action.condition === 'function' && action.condition(getState)) {
        if (process.env.NODE_ENV === 'development') console.log('[API MW] skip by condition');
        action.onSkip && action.onSkip(dispatch, getState);
        return;
    }

    const [REQ, SUCC, FAIL] = action.types;
    dispatch({ type: REQ, meta: action.meta });

    try {
        const payload = await action.call(getState, dispatch);
        dispatch({ type: SUCC, payload, meta: action.meta });
        action.onSuccess && action.onSuccess(dispatch, getState, payload);
    } catch (err) {
        dispatch({ type: FAIL, error: err?.message || String(err), meta: action.meta });
        action.onError && action.onError(dispatch, getState, err);
    }
};

export default api;
