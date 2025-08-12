import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from './rootReducer';
import persistRecentSearches from './middlewares/persistRecentSearches';

// Redux DevTools 지원(있으면)
const composeEnhancers =
    (typeof window !== 'undefined' &&
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const middlewares = [persistRecentSearches];

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middlewares)));
export default store;
