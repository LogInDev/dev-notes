import { combineReducers } from 'redux';
import uiReducer from '../features/ui/uiSlice';
import searchReducer from '../features/search/searchSlice';
import commandReducer from '../features/command/commandSlice';

export default combineReducers({
    ui: uiReducer,
    search: searchReducer,
    command: commandReducer,
});
