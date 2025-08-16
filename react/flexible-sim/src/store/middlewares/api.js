// 공용 API 미들웨어: { types:[REQ,SUCC,FAIL], call:getState=>Promise, meta?, onSuccess?, onError? }
const api = ({ dispatch, getState }) => (next) => async (action) => {
    if (!action || !action.types || !action.call) return next(action);

    const [REQ, SUCC, FAIL] = action.types;
    dispatch({ type: REQ, meta: action.meta });
    try {
        const payload = await action.call(getState, dispatch);
        dispatch({ type: SUCC, payload, meta: action.meta });
        action.onSuccess && action.onSuccess(dispatch, getState, payload);
    } catch (err) {
        const error = err?.message || String(err);
        dispatch({ type: FAIL, error, meta: action.meta });
        action.onError && action.onError(dispatch, getState, err);
    }
};
export default api;
