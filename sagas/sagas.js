//
// File: sagas/sagas.js
//

import { all } from 'redux-saga/effects';
import authSagas from './auth';
import datastoreSagas from './datastore';
import deviceSagas from './device';
import phoneSagas from './phone';
import bleEventSagas from './deviceBleEventManager';

const allSagas = [...authSagas, ...datastoreSagas, ...deviceSagas, ...bleEventSagas, ...phoneSagas];

export default function* root() {
  yield all(allSagas);
}
