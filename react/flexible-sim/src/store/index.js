import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from './rootReducer';
import api from './middlewares/api';
import persistRecentSearches from './middlewares/persistRecentSearches';

const composeEnhancers =
    (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const middlewares = [api, persistRecentSearches];

const store = createStore(
    rootReducer,                               // ★ 여기서만 rootReducer 사용
    composeEnhancers(applyMiddleware(...middlewares))
);

export default store;                         // ★ default export로 변경
