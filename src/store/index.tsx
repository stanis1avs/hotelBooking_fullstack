import { configureStore } from '@reduxjs/toolkit';
import thunk from "redux-thunk";
import { combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import reducerhotelSearch from '../reducers/reducerhotelSearch';
import reducerhotelPage from '../reducers/reducerhotelPage';
import reducermanageUsers from '../reducers/reducermanageUsers';
import reducerauthClient from '../reducers/reducerauthClient';
import reducerreservationPage from '../reducers/reducerreservationPage';
import reducersupportChat from '../reducers/reducersupportChat';
import saga from '../sagas/sagas';

const reducer = combineReducers({
  reducerhotelSearch: reducerhotelSearch,
  reducerhotelPage: reducerhotelPage,
  reducermanageUsers: reducermanageUsers,
  reducerauthClient: reducerauthClient,
  reducerreservationPage: reducerreservationPage,
  reducersupportChat: reducersupportChat
});

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: reducer,
  middleware: [sagaMiddleware, thunk]
});

sagaMiddleware.run(saga);

export type RootState = ReturnType<typeof reducer>

export type AppDispatch = typeof store.dispatch

export default store;