import { put, takeEvery, call, fork } from 'redux-saga/effects';
import { Messages, IMessages } from 'luxsmart-comms';
import { actionTypes as t } from '../reducers';
import bleApi from './deviceBleApi';
import Constants from '../utils/constants';

const discoverDevices = function* discoverDevices(action) {
  try {
    // action.requireSiteID
    yield put({ type: t.device.DISCOVER_STARTED });
    const manager = bleApi.loadDeviceManager();
    if (manager.bleEnabled) {
      manager.scan();
    } else {
      yield put({ type: t.device.DISCOVER_FAILED, error: 'Please enable bluetooth' });
    }
  } catch (error) {
    yield put({ type: t.device.DISCOVER_FAILED, error });
  }
};

const getConnected = function* getConnected(action) {
  try {
    yield put({ type: t.device.BLE_GET_CONNECTED_STARTED });
    const connected = yield call(bleApi.getConnected);
    // const discovered = yield call(bleApi.getDiscovered);
    // const all = [].concat(connected).concat(discovered);
    const all = connected;
    if (all.length) {
      const enhanced = all.map(d => ({ ...d, connected: bleApi.isConnected(d.id) }));
      yield put({
        type: t.device.BLE_GET_CONNECTED_SUCCESS,
        connected: enhanced,
      });
    } else {
      yield put({ type: t.device.BLE_GET_CONNECTED_FAILED, error: 'No connected devices' });
    }
  } catch (error) {
    yield put({ type: t.device.BLE_GET_CONNECTED_FAILED, error });
  }
};

const getData = function* getInfo(action) {
  try {
    yield put({ type: t.device.GET_DATA_STARTED, to: action.to, message: action.message });
    const packet = yield call(bleApi.getData, action.to, action.message);
    yield put({ type: t.device.GET_DATA_SUCCESS, packet });
  } catch (error) {
    yield put({ type: t.device.GET_DATA_FAILED, error });
  }
};

const addDeviceToMesh = function* addDeviceToMesh(action) {
  try {
    yield put({ type: t.device.ADD_TO_MESH_STARTED });
    yield call(bleApi.addToMesh, action.device);
    yield put({ type: t.device.ADD_TO_MESH_SUCCESS });
  } catch (error) {
    yield put({ type: t.device.ADD_TO_MESH_FAILED, error });
  }
};

const removeDeviceFromMesh = function* removeDeviceFromMesh(action) {
  try {
    yield put({ type: t.device.REMOVE_FROM_MESH_STARTED });
    yield call(bleApi.removeFromMesh, action.device.serial);
    yield put({ type: t.device.REMOVE_FROM_MESH_SUCCESS, device: action.device });
  } catch (error) {
    yield put({ type: t.device.REMOVE_FROM_MESH_FAILED, error });
  }
};

const deviceFlash = function* deviceFlash(action) {
  try {
    // Zone or device
    const serial = action.device.meshId || action.device.serial;

    // If requested, connect to this specific device when flashing. This is required when
    // flashing an uncommissioned device as it will not be able to talk to the network.
    const peripheral = action.connectToDevice ? action.device : null;

    // Send default pin if uncommissioned device.
    const pin = action.isUncommissioned ? Constants.DEVICE.DEFAULT_PIN : null;

    yield put({ type: t.device.FLASH_STARTED, device: action.device });

    // Turn off, wait, on 100 pwm, wait, off, wait, on. Always end up in on state.
    const DELAY = 1000;
    let data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_ON_OFF;
    data.on = false;
    data.minutes = 0;
    yield call(
      bleApi.setData,
      serial,
      Messages.token.SET_TEMPORARY,
      data,
      peripheral,
      false,
      null,
      undefined,
      pin,
    );
    yield call(bleApi.delay, DELAY);

    data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_PWM;
    data.pwm_percent_x_100 = 10000;
    data.minutes = 0;
    yield call(bleApi.setData, serial, Messages.token.SET_TEMPORARY, data, peripheral);
    yield call(bleApi.delay, DELAY);

    data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_ON_OFF;
    data.on = false;
    data.minutes = 0;
    yield call(bleApi.setData, serial, Messages.token.SET_TEMPORARY, data, peripheral);
    yield call(bleApi.delay, DELAY);

    data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_PWM;
    data.pwm_percent_x_100 = 10000;
    data.minutes = 0;
    yield call(bleApi.setData, serial, Messages.token.SET_TEMPORARY, data, peripheral);
    yield call(bleApi.delay, DELAY);

    data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_ON_OFF;
    data.on = false;
    data.minutes = 0;
    yield call(bleApi.setData, serial, Messages.token.SET_TEMPORARY, data, peripheral);
    yield call(bleApi.delay, DELAY);

    data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_PWM;
    data.pwm_percent_x_100 = 10000;
    data.minutes = 0;
    yield call(bleApi.setData, serial, Messages.token.SET_TEMPORARY, data, peripheral);
    yield call(bleApi.delay, DELAY);

    data = new IMessages.temp_set_t();
    data.action = Messages.TEMP_SET_USE_ON_OFF;
    data.on = true;
    data.minutes = 0;
    yield call(bleApi.setData, serial, Messages.token.SET_TEMPORARY, data, peripheral);

    yield put({ type: t.device.FLASH_SUCCESS });
  } catch (error) {
    yield put({ type: t.device.FLASH_FAILED, error });
  }
};

const deviceSetValue = function* deviceSetValue(action) {
  try {
    yield put({ type: t.device.MESH_COMMS_STARTED, message: 'Saving device value' });
    yield call(bleApi.deviceValueSet, action.serial, action.key, action.val);
    yield put({ type: t.device.MESH_COMMS_SUCCESS });
  } catch (error) {
    yield put({ type: t.device.MESH_COMMS_FAILED, error });
  }
};

const zoneSetValue = function* zoneSetValue(action) {
  try {
    yield put({ type: t.device.MESH_COMMS_STARTED, message: 'Saving devices in zone' });
    yield call(bleApi.zoneValueSet, action.zoneid, action.deviceSettings);
    yield put({ type: t.device.MESH_COMMS_SUCCESS });
  } catch (error) {
    yield put({ type: t.device.MESH_COMMS_FAILED, error });
  }
};

const watchDiscover = function* watchDiscover() {
  yield takeEvery(t.device.DISCOVER, discoverDevices);
};

const watchAddToMesh = function* watchAddToMesh() {
  yield takeEvery(t.device.ADD_TO_MESH, addDeviceToMesh);
};

const watchRemoveFromMesh = function* watchRemoveFromMesh() {
  yield takeEvery(t.device.REMOVE_FROM_MESH, removeDeviceFromMesh);
};

const watchFlash = function* watchFlash() {
  yield takeEvery(t.device.FLASH, deviceFlash);
};

const watchDeviceSetValue = function* watchDeviceSetValue() {
  yield takeEvery(t.device.SET_VALUE, deviceSetValue);
};

const watchZoneSetValue = function* watchZoneSetValue() {
  yield takeEvery(t.device.ZONE_SET_VALUE, zoneSetValue);
};

const watchGetData = function* watchGetData() {
  yield takeEvery(t.device.GET_DATA, getData);
};

const watchGetConnected = function* watchGetConnected() {
  yield takeEvery(t.device.BLE_GET_CONNECTED, getConnected);
};

const disconnect = function* disconnect(action) {
  try {
    // action.requireSiteID
    yield put({ type: t.device.MESH_COMMS_STARTED });
    // id is the ble peripheral id
    yield call(bleApi.disconnect, action.device.id);
    // Force the UI to update even if a real disconnect doesn't happen.
    yield put({
      type: t.device.BLE_DISCONNECTED,
      payload: {
        peripheral: action.device.id,
        name: action.device.name,
      },
    });
    yield put({ type: t.device.MESH_COMMS_SUCCESS, id: action.device.id });
  } catch (error) {
    yield put({ type: t.device.MESH_COMMS_FAILED, error });
  }
};
const watchDisconnect = function* watchDisconnect() {
  yield takeEvery(t.device.DISCONNECT, disconnect);
};

export default [
  fork(watchGetConnected),
  fork(watchGetData),
  fork(watchDiscover),
  fork(watchAddToMesh),
  fork(watchRemoveFromMesh),
  fork(watchFlash),
  fork(watchZoneSetValue),
  fork(watchDeviceSetValue),
  fork(watchDisconnect),
];
