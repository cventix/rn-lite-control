//
// File: store.js
//
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducer from './reducers';
import sagas from './sagas/sagas';

const defaultState = {
  auth: {
    email: '',
    isLoading: false,
    userSet: false,
    isFirstLogin: false,
  },
  site: {
    site: {},
    devices: [],
    zones: null, // Set to null so we can determine if this is the initial load in render before the firestore collection updates..
    switches: [],
  },
  device: {
    devices: [],
    deviceSettings: {},
    discovering: false,
    communicating: false,
    message: null,
  },
  phone: {},
};

const sagaMiddleware = createSagaMiddleware();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(reducer, defaultState, composeEnhancers(applyMiddleware(sagaMiddleware)));

sagaMiddleware.run(sagas);

export default store;
