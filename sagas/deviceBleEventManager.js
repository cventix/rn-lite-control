//
// File: sagas/deviceBleEventManager.js
//
import { eventChannel } from 'redux-saga';
import { put, fork, take } from 'redux-saga/effects';
import { actionTypes as t } from '../reducers';
import bleApi from './deviceBleApi';

const createCollectionEventChannel = (event, manager) => {
  const listener = eventChannel((emit) => {
    const handler = (data) => {
      emit(bleApi.processNotification(data));
    };
    // Subscribe to the BLE event.
    const remove = manager.on(event, handler);
    const unsubscribe = () => {
      remove();
    };
    return unsubscribe;
  });

  return listener;
};

/**
 * Setup an redux-saga event channel to listen to the Bluetooth Manager's Events.
 * @param  {} actionType redux action type
 * @param  {} event Ble Event to listen for
 * @param  {} manager BleDeviceManager class instance.
 */
const watchCollectionUpdate = function* watchCollectionUpdate(actionType, event, manager) {
  const updateChannel = createCollectionEventChannel(event, manager);
  while (true) {
    const payload = yield take(updateChannel);
    const data = yield payload;
    // Filter out events from peripherals we do not care about.
    if (!manager.shouldFilterOut(event, data)) {
      yield put({ type: actionType, payload: data });
    }
  }
};

let bleListenersSetup = false;
// Only do this once.
const setupBleListeners = function* setupBleListeners() {
  if (bleListenersSetup) return;
  bleListenersSetup = true;
  const manager = bleApi.loadDeviceManager();
  yield fork(
    watchCollectionUpdate,
    t.device.BLE_DISCOVERED,
    'BleManagerDiscoverPeripheral',
    manager,
  );
  yield fork(
    watchCollectionUpdate,
    t.device.BLE_UPDATED,
    'BleManagerDidUpdateValueForCharacteristic',
    manager,
  );
  yield fork(watchCollectionUpdate, t.device.BLE_CONNECTED, 'BleManagerConnectPeripheral', manager);
  yield fork(
    watchCollectionUpdate,
    t.device.BLE_DISCONNECTED,
    'BleManagerDisconnectPeripheral',
    manager,
  );
  yield fork(watchCollectionUpdate, t.device.BLE_SCAN_STOPPED, 'BleManagerStopScan', manager);
  yield fork(
    watchCollectionUpdate,
    t.device.BLE_STATE_UPDATED,
    'BleManagerDidUpdateState',
    manager,
  );
};

export default [fork(setupBleListeners)];
