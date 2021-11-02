//
// File: reducers/deviceReducer.js
//

import { Messages } from 'luxsmart-comms';
import LOG from '../utils/LOG';

//
// Action Types
//
const p = 'device/';
export const Actions = {
  BLE_DISCOVERED: `${p}BLE_DISCOVERED`,
  BLE_UPDATED: `${p}BLE_UPDATED`,
  BLE_CONNECTED: `${p}BLE_CONNECTED`,
  BLE_DISCONNECTED: `${p}BLE_DISCONNECTED`,
  BLE_SCAN_STOPPED: `${p}BLE_SCAN_STOPPED`,
  BLE_STATE_UPDATED: `${p}BLE_STATE_UPDATED`,
  BLE_GET_CONNECTED: `${p}BLE_GET_CONNECTED`,
  BLE_GET_CONNECTED_STARTED: `${p}BLE_GET_CONNECTED_STARTED`,
  BLE_GET_CONNECTED_SUCCESS: `${p}BLE_GET_CONNECTED_SUCCESS`,
  BLE_GET_CONNECTED_FAILED: `${p}BLE_GET_CONNECTED_FAILED`,

  DISCONNECT: `${p}DISCONNECT`,

  GET_DATA: `${p}GET_DATA`,
  GET_DATA_STARTED: `${p}GET_DATA_STARTED`,
  GET_DATA_SUCCESS: `${p}GET_DATA_SUCCESS`,
  GET_DATA_FAILED: `${p}GET_DATA_FAILED`,

  SET_VALUE: `${p}SET_VALUE`,

  UPDATED: `${p}UPDATED`,
  DISCOVER: `${p}DISCOVER`,
  DISCOVER_STARTED: `${p}DISCOVER_STARTED`,
  DISCOVER_SUCCESS: `${p}DISCOVER_SUCCESS`,
  DISCOVER_FAILED: `${p}DISCOVER_FAILED`,
  REMOVE_FROM_STORE: `${p}REMOVE_FROM_STORE`,
  ADD_TO_MESH: `${p}ADD_TO_MESH`,
  ADD_TO_MESH_STARTED: `${p}ADD_TO_MESH_STARTED`,
  ADD_TO_MESH_SUCCESS: `${p}ADD_TO_MESH_SUCCESS`,
  ADD_TO_MESH_FAILED: `${p}ADD_TO_MESH_FAILED`,
  REMOVE_FROM_MESH: `${p}REMOVE_FROM_MESH`,
  REMOVE_FROM_MESH_STARTED: `${p}REMOVE_FROM_MESH_STARTED`,
  REMOVE_FROM_MESH_SUCCESS: `${p}REMOVE_FROM_MESH_SUCCESS`,
  REMOVE_FROM_MESH_FAILED: `${p}REMOVE_FROM_MESH_FAILED`,
  TURN_ON: `${p}TURN_ON`,
  TURN_ON_STARTED: `${p}TURN_ON_STARTED`,
  TURN_ON_SUCCESS: `${p}TURN_ON_SUCCESS`,
  TURN_ON_FAILED: `${p}TURN_ON_FAILED`,
  TURN_OFF: `${p}TURN_OFF`,
  TURN_OFF_STARTED: `${p}TURN_OFF_STARTED`,
  TURN_OFF_SUCCESS: `${p}TURN_OFF_SUCCESS`,
  TURN_OFF_FAILED: `${p}TURN_OFF_FAILED`,
  FLASH: `${p}FLASH`,
  FLASH_FAILED: `${p}FLASH_FAILED`,
  FLASH_STARTED: `${p}FLASH_STARTED`,
  FLASH_SUCCESS: `${p}FLASH_SUCCESS`,
  PIR_ENABLE: `${p}PIR_ENABLE`,
  PIR_DISABLE: `${p}PIR_DISABLE`,
  ZONE_PIR_ENABLE: `${p}ZONE_PIR_ENABLE`,
  ZONE_PIR_DISABLE: `${p}ZONE_PIR_DISABLE`,
  ZONE_SET_LUX_TARGET: `${p}ZONE_SET_LUX_TARGET`,
  ZONE_SET_VALUE: `${p}ZONE_SET_VALUE`,
  SET_SWITCH: `${p}SET_SWITCH`,
  SET_LUX_TARGET: `${p}SET_LUX_TARGET`,
  SET_SWITCH_ON: `${p}SET_SWITCH_ON`,
  SET_SWITCH_OFF: `${p}SET_SWITCH_OFF`,
  MESH_COMMS_STARTED: `${p}MESH_COMMS_STARTED`,
  MESH_COMMS_SUCCESS: `${p}MESH_COMMS_SUCCESS`,
  MESH_COMMS_FAILED: `${p}MESH_COMMS_FAILED`,
  CALIBRATION_START: `${p}CALIBRATION_START`,
  CALIBRATION_START_STARTED: `${p}CALIBRATION_START_STARTED`,
  CALIBRATION_START_SUCCESS: `${p}CALIBRATION_START_SUCCESS`,
  CALIBRATION_START_FAILED: `${p}CALIBRATION_START_FAILED`,
  CALIBRATION_FINISH: `${p}CALIBRATION_FINISH`,
  CALIBRATION_FINISH_STARTED: `${p}CALIBRATION_FINISH_STARTED`,
  CALIBRATION_FINISH_SUCCESS: `${p}CALIBRATION_FINISH_SUCCESS`,
  CALIBRATION_FINISH_FAILED: `${p}CALIBRATION_FINISH_FAILED`,
};

//
// Action Creators
// ...

//
// Selectors
//
export const getLuxSmartDevice = (d) => {
  const device = Object.assign({}, d);

  if (device.name) {
    // device.name will look like LUX Smart 0x5B2FF08A
    // device.advertising.localName may look like Zone 1 L:2 0x33E5C778
    if (device.advertising && device.advertising.localName) {
      device.name = device.advertising.localName;
    }
    device.serial = Number(device.name.split(' ').pop());
  }
  if (device.rssi) {
    // RSSI is negative integer so convert to positive for display purposes.
    device.signal = device.rssi * -1;
  }
  return device;
};

const sortBySignal = (a, b) => {
  if (a.signal < b.signal) return -1;
  if (a.signal > b.signal) return 1;
  return 0;
};

const asHex = num => `0x${Number(num).toString(16)}`;

const getErrorMsg = (status) => {
  switch (status) {
    case Messages.FLEXIO_COMM_OK:
      break;
    case Messages.FLEXIO_COMM_UNKNOWN:
      return 'Unknown message token';
    case Messages.FLEXIO_COMM_TOKEN_MISMATCH:
      return 'Reply token did not match request token';
    case Messages.FLEXIO_COMM_SEQUENCE_MISMATCH:
      return 'Reply did not match the send sequence number';
    case Messages.FLEXIO_COMM_CORRUPT:
      return 'CRC or structure failed - bad packet';
    case Messages.FLEXIO_COMM_TIMEOUT:
      return 'Reply did not arrive in the expected timeframe';
    case Messages.FLEXIO_COMM_TOO_LONG:
      return 'Trying to send a block that is loo long for the payload';
    case Messages.FLEXIO_COMM_CANT:
      return "Requested operation can't be performed";
    case Messages.FLEXIO_COMM_BUSY:
      return "Unit is busy and can't perfrom the requested operation now,";
    case Messages.FLEXIO_COMM_NO_COMMS:
      return 'No comms channel available';
    case Messages.FLEXIO_COMM_FAIL:
      return 'Authenticating';
    case Messages.FLEXIO_COMM_BAD_PARAMETER:
      return 'Parameter was not in the expected range';
    case Messages.FLEXIO_COMM_ADDRESS_MISMATCH:
      return 'Address did not match';
    default:
      break;
  }

  return null;
};

const getError = (error) => {
  let err = error;
  if (err && err.message) {
    err = err.message.replace(/Error:\s?/gi, '');
  }
  return err;
};

const processDataState = (state, action) => {
  // console.log('BLE_UPDATED', action);
  const { packet } = action.payload;
  const error = getErrorMsg(packet.status);

  if (error) {
    return { ...state, message: error };
  }
  // if (packet.token === Messages.token.GET_SETTINGS) {
  //   return {
  //     ...state,
  //     deviceSettings: packet.data,
  //   };
  // }
  if (packet.token === Messages.token.GET_INFO) {
    return {
      ...state,
      deviceInfo: packet.data,
    };
  }
  if (packet.token === Messages.token.GET_NETWORK_SETTINGS) {
    // We only care about the zone_id from network settings.
    const devices = state.devices.slice();
    const pos = devices.findIndex(d => d.serial === packet.from);

    if (pos !== -1) {
      devices[pos].zoneMeshId = packet.data.zone_id; // IMessages.network_settings_t
      return {
        ...state,
        devices,
      };
    }
  }
  return null;
};

//
// Reducers

const deviceReducer = (
  s = {
    devices: [],
    deviceSettings: {},
    discovering: false,
    communicating: false,
    message: null,
  },
  action,
) => {
  // Clear the message on each device reducer;
  const state = { ...s, message: null };

  switch (action.type) {
    //
    // BLE Specific Reducers
    //
    case Actions.BLE_DISCOVERED: {
      // If not a lux smart device then ignore.
      const device = getLuxSmartDevice(action.payload);
      if (!device) return state;

      // Because we are continuously scanning for a period of n seconds
      // we will get duplicates so need to check before we add them to the store.
      const exists = state.devices.find(d => d.id === device.id);
      if (exists) return state;

      // All looks ok so add the device.
      let devices = state.devices.slice();
      devices.push(device);
      devices = devices.sort(sortBySignal);

      return { ...state, devices };
    }
    case Actions.BLE_UPDATED: {
      // console.log('BLE_UPDATED', action);
      const processedState = processDataState(state, action);
      if (processedState) return processedState;
      return state;
    }
    case Actions.BLE_CONNECTED: {
      const devices = state.devices.slice();
      const deviceIndex = devices.findIndex(d => d.id === action.payload.peripheral);

      if (deviceIndex !== -1) {
        devices[deviceIndex].connected = true;
      }

      return { ...state, devices, message: `Connected to ${action.payload.name}` };
    }
    case Actions.BLE_DISCONNECTED: {
      const devices = state.devices.slice();
      const deviceIndex = devices.findIndex(d => d.id === action.payload.peripheral);

      if (deviceIndex !== -1) {
        devices[deviceIndex].connected = false;
      }

      return { ...state, devices, message: `Disconnected from ${action.payload.name}` };
    }
    case Actions.BLE_SCAN_STOPPED: {
      // console.log('Scan stopped');
      return {
        ...state,
        discovering: false,
        communicating: false,
      };
    }
    case Actions.BLE_STATE_UPDATED:
      return { ...state };

    case Actions.GET_DATA_STARTED: {
      // Clear existing state objects when making a new request.
      switch (action.message) {
        case Messages.token.GET_INFO: {
          return {
            ...state,
            deviceInfo: null,
            communicating: true,
          };
        }
        case Messages.token.GET_NETWORK_SETTINGS: {
          // We only care about the zone_id from network settings.
          const devices = state.devices.slice();
          const pos = devices.findIndex(d => d.serial === action.to);

          if (pos !== -1) {
            devices[pos].zoneMeshId = null;
            return {
              ...state,
              devices,
              communicating: true,
            };
          }
          break;
        }
        default: {
          break;
        }
      }
      return { ...state, communicating: true };
    }
    case Actions.GET_DATA_SUCCESS: {
      return { ...state, communicating: false };
    }
    case Actions.GET_DATA_FAILED: {
      return { ...state, communicating: false, message: getError(action.error) };
    }
    case Actions.BLE_GET_CONNECTED_STARTED: {
      // console.log('BLE_GET_CONNECTED_STARTED');
      return { ...state, communicating: true };
    }
    case Actions.BLE_GET_CONNECTED_SUCCESS: {
      // console.log('BLE_GET_CONNECTED_SUCCESS', action);
      const connectedDevices = action.connected;
      const devices = state.devices.slice();
      connectedDevices.forEach((connected) => {
        if (!devices.some(d => d.id === connected.id)) {
          devices.push(getLuxSmartDevice(connected));
        }
      });
      const sortedDevices = devices.sort(sortBySignal);

      return { ...state, communicating: false, devices: sortedDevices };
    }
    case Actions.BLE_GET_CONNECTED_FAILED: {
      // console.log('BLE_GET_CONNECTED_FAILED');
      return { ...state, communicating: false };
    }

    // Devices array has been updatd.
    case Actions.UPDATED: {
      const devices = action.devices.slice();
      return { ...state, devices };
    }

    //
    // Device reducers.
    //
    case Actions.DISCOVER_STARTED: {
      return {
        ...state,
        discovering: true,
        devices: [],
      };
    }
    case Actions.DISCOVER_SUCCESS: {
      const devices = action.devices.slice().sort((a, b) => {
        if (a.signal < b.signal) return 1;
        if (a.signal > b.signal) return -1;
        return 0;
      });
      return {
        ...state,
        discovering: false,
        devices,
      };
    }
    case Actions.DISCOVER_FAILED:
      return { ...state, discovering: false, message: getError(action.error) };
    case Actions.REMOVE_FROM_STORE: {
      return {
        ...state,
        devices: state.devices.filter(d => d.serial !== action.serial),
      };
    }
    case Actions.ADD_TO_MESH_STARTED:
      return { ...state, communicating: true };
    case Actions.ADD_TO_MESH_SUCCESS:
      return { ...state, communicating: false };
    case Actions.ADD_TO_MESH_FAILED:
      return { ...state, communicating: false, message: getError(action.error) };
    case Actions.REMOVE_FROM_MESH_STARTED:
      return { ...state, communicating: true };
    case Actions.REMOVE_FROM_MESH_SUCCESS:
      // return { ...state, communicating: false, message: `${asHex(action.device.serial)} removed` };
      return { ...state, communicating: false, message: `${action.device.serial} removed` };
    case Actions.REMOVE_FROM_MESH_FAILED:
      return { ...state, communicating: false, message: getError(action.error) };
    case Actions.TURN_ON_STARTED:
      return { ...state, communicating: true };
    case Actions.TURN_ON_SUCCESS:
      return { ...state, communicating: false };
    case Actions.TURN_ON_FAILED:
      return { ...state, communicating: false, message: getError(action.error) };
    case Actions.TURN_OFF_STARTED:
      return { ...state, communicating: true };
    case Actions.TURN_OFF_SUCCESS:
      return { ...state, communicating: false };
    case Actions.TURN_OFF_FAILED:
      return { ...state, communicating: false, message: getError(action.error) };
    case Actions.FLASH_STARTED:
      return { ...state, communicating: true, message: 'Connecting to the light' };
    case Actions.FLASH_SUCCESS:
      return { ...state, communicating: false };
    case Actions.FLASH_FAILED: {
      LOG.console(action);
      return { ...state, communicating: false, message: getError(action.error) };
    }
    case Actions.MESH_COMMS_STARTED: {
      const { message } = action;
      // if (!message) message = 'Communicating with device';
      return { ...state, communicating: true, message };
    }
    case Actions.MESH_COMMS_SUCCESS:
      return { ...state, communicating: false };
    case Actions.MESH_COMMS_FAILED: {
      return { ...state, communicating: false, message: getError(action.error) };
    }
    case Actions.CALIBRATION_START_STARTED:
      return { ...state, communicating: true };
    case Actions.CALIBRATION_START_SUCCESS:
      return { ...state, communicating: false };
    case Actions.CALIBRATION_START_FAILED:
      return { ...state, communicating: false, message: getError(action.error) };
    case Actions.CALIBRATION_FINISH_STARTED:
      return { ...state, communicating: true };
    case Actions.CALIBRATION_FINISH_SUCCESS:
      return { ...state, communicating: false, device: action.device };
    case Actions.CALIBRATION_FINISH_FAILED:
      return { ...state, communicating: false, message: getError(action.error) };
    default:
      // console.log('UNKNOWN DISPATCH TYPE:', action.type);
      return s;
  }
};

export default deviceReducer;
