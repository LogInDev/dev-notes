import { combineReducers } from 'redux';
import uiReducer from '../features/ui/uiSlice';
import searchReducer from '../features/search/searchSlice';   // (있다면 유지)
import commandReducer from '../features/command/commandSlice';// (있다면 유지)
import historyReducer from '../features/ai/historySlice';
import resultReducer from '../features/ai/resultSlice';

export default combineReducers({
    ui: uiReducer,
    search: searchReducer,
    command: commandReducer,
    history: historyReducer,
    result: resultReducer,
});
