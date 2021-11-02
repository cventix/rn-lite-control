//
// File: sagas/deviceBleApi.js
//
//
// This is the bluetooth gateway API.
//
import { Messages, IMessages, Packet } from 'luxsmart-comms';
import { bytesToString } from 'convert-string';
import firebase from '../config/firebase';
import BleDeviceManager from '../services/BleDeviceManager';
import LOG from '../utils/LOG';
import Constants from '../utils/constants';
import store from '../store';

const db = firebase.firestore();
const {
  SERVICE,
  SERVICEFILTER,
  WRITECHARACTERISTIC,
  NOTIFICATIONCHARACTERISTIC,
  NAMEFILTER,
  FROM,
} = Constants.DEVICE;
let sequence = 0;
let lastConnectedDevInfo = {};
let deviceManager = null;

/**
 * Single log pipe to easy disable when needing to clean up console.
 * @param  {} args
 */
const log = (...args) => {
  const DEBUG = true;
  if (DEBUG) {
    LOG.console('BleApi:', ...args);
  }
};

const delay = duration =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

const createPacket = (to, message, data) => {
  // Reset the sequence ID when it reaches max uInt8 value.
  sequence += 1;
  if (sequence > 255) {
    sequence = 0;
  }

  const packet = new Packet(to, FROM, message, sequence);
  packet.create(data);
  return packet;
};

const stopDeviceManager = () => {
  if (deviceManager) {
    deviceManager.removeListeners();
    deviceManager = null;
  }
};

const loadDeviceManager = () => {
  if (!deviceManager) {
    deviceManager = new BleDeviceManager(
      SERVICE,
      NOTIFICATIONCHARACTERISTIC,
      WRITECHARACTERISTIC,
      [NAMEFILTER],
      [SERVICEFILTER],
    );

    // Only call this once per app session.
    deviceManager.start();
    deviceManager.listen();

    // Add some additional BLE listeners for logging purposes.
    //
    // deviceManager.on('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    // deviceManager.on('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic);
    deviceManager.on('BleManagerConnectPeripheral', async (data) => {
      await LOG.ble(data.peripheral, deviceManager.getPeripheralName(data.peripheral), 'connect');
    });
    deviceManager.on('BleManagerDisconnectPeripheral', async (data) => {
      await LOG.ble(data.peripheral, deviceManager.getPeripheralName(data.peripheral), 'disconnect');
    });
    // deviceManager.on('BleManagerStopScan', handleStopScan);
  }

  return deviceManager;
};

const loadPacketFromNotification = (data) => {
  const hex = bytesToString(data.value);
  const packet = new Packet();
  packet.process(hex);
  return packet;
};

const processNotification = async (data) => {
  const received = data;
  const manager = loadDeviceManager();

  if (received.value) {
    received.packet = loadPacketFromNotification(received);

    if (received.packet.data instanceof IMessages.dev_info_t) {
      lastConnectedDevInfo = { ...received.packet.data };
    }

    log(`Received Packet ${received.packet.hexData}`, received.packet.prettyObj());
    await LOG.packet(
      lastConnectedDevInfo.hardware_version,
      lastConnectedDevInfo.firmware_version,
      received.packet,
      'received',
      received.peripheral,
      manager.getPeripheralName(received.peripheral),
    );
  }

  // Add some more details to the received notification.
  if (received.peripheral && !received.name) {
    received.name = manager.getPeripheralName(received.peripheral);
  }

  return received;
};

/**
 * Sort by RSSI. RSSI is a negative number.
 * @param  {} a first device
 * @param  {} b second device
 */
const sortBySignal = (a, b) => {
  if (a.rssi < b.rssi) return 1;
  if (a.rssi > b.rssi) return -1;
  return 0;
};

const isConnected = (peripheralId) => {
  const manager = loadDeviceManager();
  return manager.isConnected(peripheralId);
};

const getConnected = () => {
  const manager = loadDeviceManager();
  return manager.getConnected();
};

const getDiscovered = () => {
  const manager = loadDeviceManager();
  return manager.getDiscovered();
};

const getDeviceSerial = (peripheral) => {
  if (peripheral.serial) return peripheral.serial;
  return Number(peripheral.name.split(' ').pop());
};

/**
 * Check for connected and discovered peripherals
 * and return a list of devices sorted by the strongest signal strength.
 * @return the previously discovered/connected device [] sorted by strongest signal strength.
 */
const getNearestDeviceList = async () => {
  log('getNearestDeviceList');
  const manager = loadDeviceManager();
  if (!manager.bleEnabled) throw new Error('Please enable bluetooth');

  try {
    // Generate a list of connected and discovered peripherals.
    const connected = await manager.getConnected();
    const discovered = await manager.getDiscovered();
    const peripherals = [...connected, ...discovered];

    if (peripherals.length) {
      // Disable RSSI based selection as changing connections and having multiple
      // connections seems to cause issues with mesh comms.
      //
      // If there is more than one option, then retrieve the rssi
      // so the strongest connection will be made.
      // if (peripherals.length > 1) {
      //   for (let i = 0; i < peripherals.length; i += 1) {
      //     if (manager.isConnected(peripherals[i].id)) {
      //       peripherals[i].rssi = await manager.readRSSI(peripherals[i].id);
      //       log('Updated RSSI', peripherals[i].id, peripherals[i].rssi);
      //     }
      //   }
      // }
      return peripherals.sort(sortBySignal);
    }
  } catch (err) {
    log('Error getting device', err);
  }
  log('Could not find a light to connect to');
  return [];
};
/**
 * Connect to a peripheral or find a mesh one to connect to. If once cannot be found a scan
 * will be performed then the function will retry.
 *
 * @param  {} peripheral=null If the peripheral is passed in here, then the connection will be made
 *                            to it, otherwise a connection will be made to a provisioned device.
 * @param {} serialPreference=null The serial number of the ble device that is preferred to connect to.
 * @param {} scanAttempts=0 Parameter used to count the number of recursion attempts after a scan
 *                          is performed to try and find additional devices.
 *                          Do not pass this in.
 * @returns {} peripheral to connect to or null if one cannot be found.
 */
const getConnectionCandidate = async (
  peripheral = null,
  serialPreference = null,
  scanAttempts = 0,
) => {
  if (!peripheral) {
    const peripherals = await getNearestDeviceList();
    if (peripherals.length) {
      let connectTo;
      // Only return peripherals that have been added to the site.
      const state = store.getState();
      const siteDeviceSerials = state.site.devices.map(d => d.serial);
      const allowedDiscoveredDevices = peripherals.filter((p) => {
        const serial = getDeviceSerial(p);
        if (siteDeviceSerials.indexOf(serial) !== -1) {
          if (serialPreference && serial === serialPreference) {
            connectTo = p;
          }
          return true;
        }
        return false;
      });

      if (connectTo) {
        return connectTo;
      }
      if (allowedDiscoveredDevices.length) {
        return allowedDiscoveredDevices.sort(sortBySignal)[0];
      }
    } else {
      // Nothing was found, so try a scan first then retry.
      const maxRetrys = 1;
      if (scanAttempts < maxRetrys) {
        const manager = loadDeviceManager();
        manager.scan();
        // Scans results happen in another event so just wait for 5 seconds then retry here.
        await delay(5000);
        return getConnectionCandidate(peripheral, serialPreference, scanAttempts + 1);
      }
    }
    // Nothing could be found so throw an exception.
    throw new Error('Could not find a light to connect to. Please check your lights.');
  }

  return peripheral;
};

// /**
//  * Setup a packet notification listener which either resolves the promise once a
//  * notification with the correct sequence number has been received, or rejects it
//  * after a timeout or error.
//  *
//  * @param  {} expectedSequence
//  * @param  {} waitTime=20000 ms before timeout
//  */
// const notificationPacketPromise = (expectedSequence, waitTime = 20000) => {
//   const ms = waitTime;
//   let eventListener = null;

//   const timeout = new Promise((resolve, reject) => {
//     const id = setTimeout(() => {
//       clearTimeout(id);

//       reject(`Did not receive a response after ${ms / 1000} seconds.`);

//       if (eventListener) eventListener.remove();
//     }, ms);
//   });

//   const manager = loadDeviceManager();
//   const response = new Promise((resolve, reject) => {
//     eventListener = manager.on('BleManagerDidUpdateValueForCharacteristic', (data) => {
//       if (!data.value) return;
//       const received = loadPacketFromNotification(data);

//       if (received.sequence === expectedSequence) {
//         // These are the droids we are looking for.
//         resolve(received);

//         // Remove the event listener.
//         eventListener.remove();
//       }
//     });
//   });

//   // If the timeout is reached in the timeout promise,
//   // then the timeout promise rejection is performed.
//   return Promise.race([response, timeout]);
// };

/**
 * Setup a packet notification listener which either resolves the promise once a
 * notification with the correct sequence number has been received, or rejects it
 * after a timeout or error.
 *
 * @param  {} expectedSequence
 * @param  {} waitTime=5000 ms before timeout
 */
const notificationPacketPromise = (expectedSequence, waitTime = 5000) => {
  const ms = waitTime;
  const manager = loadDeviceManager();
  let resolved = false;

  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);

      if (!resolved) {
        reject(`Did not receive a response after ${ms / 1000} seconds.`);
        manager.removeFromNotificationProcessorQueue(expectedSequence);
      }
    }, ms);
  });

  const response = new Promise((resolve, reject) => {
    const handler = (data) => {
      if (!data.value) return false;
      const received = loadPacketFromNotification(data);

      if (received.sequence === expectedSequence) {
        // These are the droids we are looking for.
        resolve(received);
        resolved = true;
      }
      return resolved;
    };
    // manager will process this queue when it receives a
    // 'BleManagerDidUpdateValueForCharacteristic' event.
    manager.addToNotificationProcessorQueue(expectedSequence, handler);
  });

  // If the timeout is reached in the timeout promise,
  // then the timeout promise rejection is performed.
  return Promise.race([response, timeout]);
};

/**
 * Only resolve the promise once a certain number of notifications containing packets with
 * the samee token have been received.
 *
 * Note: Sequence numbers are 0 responses from multi packet requests.
 *
 * If all packets are not received within 120 seconds then the promise will be rejected.
 * If all packets are received within 120 seconds then the promise is resolved with an array
 * of the packets.
 *
 * @param  {} expectedResultCount The number of expected results.
 * @param token The type of packet token to accept as a response packet.
 * @param  {} waitTime=120000 ms before timeout
 * @returns Promise
 */
const notificationMultiPacketResponse = (expectedResultCount, token, waitTime = 120000) => {
  const ms = waitTime;
  let eventListener = null;

  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);

      reject(`Did not receive all responses within the ${ms / 1000} second limit.`);

      if (eventListener) eventListener.remove();
    }, ms);
  });

  const response = new Promise((resolve, reject) => {
    const manager = loadDeviceManager();
    const results = [];
    eventListener = manager.on('BleManagerDidUpdateValueForCharacteristic', (data) => {
      if (!data.value) return;
      const received = loadPacketFromNotification(data);

      if (received.token === token) {
        // These are the droids we are looking for.
        results.push(received);
        if (results.length === expectedResultCount) {
          resolve(results);
          // Remove the event listener.
          eventListener.remove();
        }
      }
    });
  });

  // If the timeout is reached in the timeout promise,
  // then the timeout promise rejection is performed.
  return Promise.race([response, timeout]);
};

const onBeforeWrite = (p, connectTo) =>
  log(`Sending Packet ${p.hexData}`, p.prettyObj(), `Connecting to ${connectTo.name}`);
const onAfterWrite = async (p, connectTo) => {
  await LOG.packet(
    lastConnectedDevInfo.hardware_version,
    lastConnectedDevInfo.firmware_version,
    p,
    'sent',
    connectTo.id,
    connectTo.name,
  );
};

/**
 * Connect to the first discovered device to write the packet to.
 * It will propagate via the mesh. Do not expect a notification.
 *
 * @param  {} packet
 * @param  {} peripheral=null
 * @param  {} expectResponse=true
 */
const connectAndWriteWithoutNotification = async (
  packet,
  peripheral = null,
  maxByteSize = null,
  queueSleepTime = null,
) => {
  try {
    const manager = loadDeviceManager();
    const connectTo = await getConnectionCandidate(peripheral);
    if (!connectTo) return;

    await manager.connectNow(connectTo.id);

    onBeforeWrite(packet, connectTo);
    await manager.writeNowWithoutNotification(
      connectTo.id,
      packet.hexData,
      maxByteSize,
      queueSleepTime,
    );
    onAfterWrite(packet, connectTo);
  } catch (e) {
    log('Error writing packed data', e);
    throw new Error(e);
  }
};

/**
 * Connect and write a packet to a device.
 *
 * @param  {} packet The packet (luxsmart-comms Packet) to send
 * @param  {} peripheral=null If the peripheral is passed in here, then the connection will be made
 *                            to it, otherwise a connection will be made to a provisioned device.
 * @param  {} ignoreQueue=false If set, the write attempt will happen immediately
 *                              instead of beling added to the processing queue.
 *                              Be careful with this as the BLE stack can get confused.
 */
const connectAndWrite = async (packet, peripheral = null, ignoreQueue = false) => {
  try {
    const manager = loadDeviceManager();
    const connectTo = await getConnectionCandidate(peripheral);
    if (!connectTo) throw new Error('Could not find a light to connect to.');

    await manager.connectNow(connectTo.id);

    if (ignoreQueue) {
      onBeforeWrite(packet, connectTo);
      await manager.writeNow(connectTo.id, packet.hexData);
      onAfterWrite(packet, connectTo);
    } else {
      manager.write(
        connectTo.id,
        packet.hexData,
        () => onBeforeWrite(packet, connectTo),
        () => onAfterWrite(packet, connectTo),
      );
    }
  } catch (e) {
    log('Error writing packet', e);
    throw new Error(e);
  }
};

const writeWithoutResponse = async (
  TO,
  message,
  data = null,
  peripheral = null,
  ignoreQueue = false,
) => {
  const packet = createPacket(TO, message, data);
  await connectAndWrite(packet, peripheral, ignoreQueue);
  return packet;
};

/**
 * Write to the ble device and resolve only after the device has sent a notification.
 * If a timeout or error happens, then a write retry is performed.
 * If a write fails more than 2 times then null is returned.
 * @param  {} TO serial number of device
 * @param  {} message message token
 * @param  IMessage.* data=null data to send
 * @param  {} peripheral=null peripheral to connect to
 * @param  {} ignoreQueue=false ignore the queue processing of  messages. Do not use this if not absolutely necessary.
 * @param {} writeAttempts the number of write attempts that have already been tried.
 * @param {} waitTime ms before timeout
 * @param {} pin=null specify the pin code to use. If not specified, then the site pin code will be used if it exists.
 */
const write = async (
  TO,
  message,
  data = null,
  peripheral = null,
  ignoreQueue = false,
  writeAttempts = 0,
  expectedResultCount = null,
  waitTime = undefined,
  pin = null,
) => {
  const maxAttempts = 2;
  const attempt = writeAttempts + 1;
  let isPinRequest = false;
  let connectTo = peripheral;

  try {
    if (!connectTo) {
      connectTo = getConnectionCandidate(null);
    }

    const packet = await writeWithoutResponse(TO, message, data, connectTo, ignoreQueue);

    if (expectedResultCount !== null) {
      return await notificationMultiPacketResponse(expectedResultCount, packet.token);
    }

    const received = await notificationPacketPromise(packet.sequence, waitTime);

    if (message !== Messages.token.PIN_CODE_SEND && received.status === Messages.FLEXIO_COMM_FAIL) {
      // The PIN has not been set.
      // Write the PIN to the device that sent the FLEXIO_COMM_FAIL message.

      isPinRequest = true; // Used for error handling.

      // If no pin code has been passed in, and there is no site store to retrieve the site pin,
      // then cancel the show.
      const pinData = new IMessages.pin_code_t();
      if (pin !== null) {
        pinData.pin_code = pin;
      } else {
        const state = store.getState();
        const { site } = state.site;
        if (!site || !site.data().pin) {
          throw new Error('Authentication Error. No PIN code');
        }
        pinData.pin_code = site.data().pin;
      }

      const pinPacket = await write(
        received.from,
        Messages.token.PIN_CODE_SEND,
        pinData,
        connectTo,
      );
      if (!pinPacket.isOK) throw new Error('Authentication Error. Invalid PIN code.');

      // Resend the original packet.
      return write(
        TO,
        message,
        data,
        connectTo,
        ignoreQueue,
        writeAttempts,
        expectedResultCount,
        waitTime,
        pin,
      );
    }
    return received;
  } catch (e) {
    if (!isPinRequest && attempt <= maxAttempts) {
      LOG.console(e, 'Retrying...');
      const retry = write(
        TO,
        message,
        data,
        connectTo,
        ignoreQueue,
        attempt,
        expectedResultCount,
        waitTime,
        pin,
      );
      return retry;
    }
    // Critical write failuer. Exit.
    throw new Error(e);
  }
};

const writeWithoutNotification = async (
  packet,
  maxByteSize = null,
  queueSleepTime = null,
  peripheral = null,
  writeAttempts = 0,
) => {
  const maxAttempts = 3;
  const attempt = writeAttempts + 1;

  try {
    await connectAndWriteWithoutNotification(packet, peripheral, maxByteSize, queueSleepTime);
  } catch (e) {
    if (attempt <= maxAttempts) {
      LOG.console(e, 'Retrying writeWithoutNotification...');
      await writeWithoutNotification(packet, maxByteSize, queueSleepTime, peripheral, attempt);
    }
  }
};

const isAuthenticated = async (serial, peripheral) => {
  try {
    const packet = await writeWithoutResponse(serial, Messages.token.GET_INFO, null, peripheral);
    const received = await notificationPacketPromise(packet.sequence);
    if (received.isOK) {
      return true;
    }
  } catch (error) {
    // Most likely time out.
    LOG.console('isAuthenticated Error', error);
  }
  return false;
};

const authenticate = async (serial, peripheral, pin) => {
  try {
    const pinData = new IMessages.pin_code_t();
    pinData.pin_code = pin;
    const packet = await writeWithoutResponse(
      serial,
      Messages.token.PIN_CODE_SEND,
      pinData,
      peripheral,
    );
    const received = await notificationPacketPromise(packet.sequence);
    if (received.isOK) {
      return true;
    }
  } catch (error) {
    // Most likely time out.
    LOG.console('authenticate Error', error);
  }
  return false;
};

/**
 * @param  {} TO Zone ID or Device Serial Number.
 * @param  {} message The Messages.token.* message to send.
 * @param {} peripheral the bluetooth device to send to. If null then nearest found is used.
 * @param ignoreQueue=false Perform action straight away without waiting for others in processing queue.
 * @param expectedResultCount=null Set to number of results expected if this is a multi packet response request.
 * @param {} waitTime ms before timeout
 * @param {} pin=null specify the pin code to use. If not specified, then the site pin code will be used if it exists.
 */
const getData = async (
  TO,
  message,
  peripheral = null,
  ignoreQueue = false,
  expectedResultCount = null,
  waitTime = undefined,
  pin = null,
) => {
  const received = await write(
    TO,
    message,
    null,
    peripheral,
    ignoreQueue,
    0,
    expectedResultCount,
    waitTime,
    pin,
  );
  return received;
};

/**
 * @param  {} TO Zone ID or Device Serial Number.
 * @param  Messages. message The Messages.token.* message to send.
 * @param IMessage.data data to set
 * @param {} peripheral=null the bluetooth device to send to. If null then nearest found is used.
 * @param ignoreQueue=false Perform action straight away without waiting for others in processing queue.
 * @param expectedResultCount=null Set to number of results expected if this is a multi packet response request.
 * @param {} waitTime ms before timeout
 * @param {} pin=null specify the pin code to use. If not specified, then the site pin code will be used if it exists.
 */
const setData = async (
  TO,
  message,
  data,
  peripheral = null,
  ignoreQueue = false,
  expectedResultCount = null,
  waitTime = undefined,
  pin = null,
) => {
  const received = await write(
    TO,
    message,
    data,
    peripheral,
    ignoreQueue,
    0,
    expectedResultCount,
    waitTime,
    pin,
  );
  return received;
};

/**
 * Connect to the nearest device and send a packet to all devices within a zone.
 *
 * @param  {} zoneMeshId The zone mesh id to apply the settings to.
 * @param  {} deviceSettings The IMessages.data object to send.
 */
const zoneValueSet = async (zoneMeshId, deviceSettings) => {
  try {
    const currentSettingsPacket = await getData(zoneMeshId, Messages.token.GET_SETTINGS);
    if (currentSettingsPacket.status === Messages.FLEXIO_COMM_OK) {
      const settings = { ...currentSettingsPacket.data, ...deviceSettings };

      // Always add a 2% buffer to the lux_active value.
      settings.lux_active += Math.ceil(settings.lux_active * 0.02);

      await setData(zoneMeshId, Messages.token.SET_SETTINGS, settings);
    }
  } catch (error) {
    LOG.console('No devices found in zone', error);
    throw new Error('No devices found in zone');
  }
};

/**
 * Write to a device. The message token is determined by the key.
 *
 * Currently supports: key={'name' | 'zoneMeshId'}
 *
 * @param  {} deviceSerial
 * @param  {} key
 * @param  {} val
 */
const deviceValueSet = async (deviceSerial, key, val) => {
  switch (key) {
    case 'name': {
      await setName(deviceSerial, val, Messages.NAME_LIGHT);
      await reboot(deviceSerial);
      break;
    }
    case 'zoneMeshId': {
      const zone = val;

      // Set the zone settings to the device.
      const packetSettings = await getData(deviceSerial, Messages.token.GET_SETTINGS);
      if (!packetSettings.data) {
        throw new Error('Unable to retrieve device settings');
      }
      // Always add a 2% buffer to the lux_active value.
      packetSettings.data.lux_active = zone.lux_active + Math.ceil(zone.lux_active * 0.02);
      packetSettings.data.power_saving = zone.power_saving;
      packetSettings.data.power_PIR_expired = zone.power_PIR_expired;
      packetSettings.data.time_saving = zone.time_saving;
      packetSettings.data.time_PIR_expired = zone.time_PIR_expired;
      packetSettings.data.zone_PIR_expired = zone.zone_PIR_expired;
      packetSettings.data.zone_PIR_enabled = zone.zone_PIR_enabled;

      await setData(deviceSerial, Messages.token.SET_SETTINGS, packetSettings.data);

      // Set the new zone name
      await setName(deviceSerial, zone.name, Messages.NAME_ZONE);

      // Set the new network settings.
      const packetNetwork = await getData(deviceSerial, Messages.token.GET_NETWORK_SETTINGS);
      if (!packetNetwork.data) {
        throw new Error('Unable to retrieve network settings');
      }
      const zone_id = zone.meshId;
      const data = packetNetwork.data;
      data.zone_id = zone_id;
      await setData(deviceSerial, Messages.token.SET_NETWORK_SETTINGS, data);

      await reboot(deviceSerial);
      break;
    }
    default: {
      break;
    }
  }
};

const setName = async (serial, name, nameTypeID, peripheral = null, pin = null) => {
  const nameData = new IMessages.name_t();
  nameData.nameString = name;
  nameData.id = nameTypeID;
  const packet = await setData(
    serial,
    Messages.token.SET_NAME,
    nameData,
    peripheral,
    false,
    null,
    undefined,
    pin,
  );
  if (!packet.isOK) throw new Error(`Unable to set the name: ${packet.status}`);
};

const getName = async (serial, nameTypeID, peripheral = null) => {
  const nameData = new IMessages.name_t();
  nameData.id = nameTypeID;
  const packet = await getData(serial, Messages.token.getName, peripheral);
  if (!packet.isOK) throw new Error(`Unable to get the name: ${packet.status}`);
};

const reboot = async (to, peripheral = null) => {
  const isAuthed = await isAuthenticated(to, peripheral);
  if (!isAuthed) {
    const state = store.getState();
    const { site } = state.site;
    if (!site || !site.data().pin) {
      throw new Error('Authentication Error. No Site PIN code');
    }
    await authenticate(to, peripheral, site.data().pin);
  }
  await writeWithoutResponse(to, Messages.token.REBOOT, null, peripheral);
};

/**
 * Adding to the mesh requires setting
 * the device settings using SET_SETTINGS
 * the zone_id and network_key using SET_NETWORK_SETTINGS,
 * the site_id using SET_SITE_ID,
 * the device, site, and zone name using SET_NAME,
 * the installer_id using SET_INSTALLER_ID
 * then rebooting the device so the changes can take effect.
 *
 * @param  {} device
 * @param {} zoneData
 * @param {} siteData
 * @param {} peripheral
 */
const addToMesh = async (device, zoneData, siteData, peripheral) => {
  // Save the device.settings which is an IMessages.device_settings_t instance
  let packet = await getData(
    device.serial,
    Messages.token.GET_SETTINGS,
    peripheral,
    false,
    null,
    undefined,
    Constants.DEVICE.DEFAULT_PIN,
  );
  if (!packet.isOK) throw new Error(`Unable to retrieve settings: ${packet.status}`);
  const newSettings = { ...packet.data, ...device.settings };
  packet = await setData(device.serial, Messages.token.SET_SETTINGS, newSettings, peripheral);
  if (!packet.isOK) throw new Error(`Unable to set settings: ${packet.status}`);

  // Save the site id
  const siteIdData = new IMessages.U32_t();
  siteIdData.val = device.siteMeshId;
  packet = await setData(device.serial, Messages.token.SET_SITE_ID, siteIdData, peripheral);
  if (!packet.isOK) throw new Error(`Unable to set site id: ${packet.status}`);

  // Save the installer id.
  const { currentUser } = firebase.auth();
  const userDoc = await db
    .collection('users')
    .doc(currentUser.uid)
    .get();
  if (userDoc.exists) {
    const installerIdData = new IMessages.U32_t();
    installerIdData.val = userDoc.data().installer_id;
    packet = await setData(
      device.serial,
      Messages.token.SET_INSTALLER_ID,
      installerIdData,
      peripheral,
    );
    if (!packet.isOK) throw new Error(`Unable to set the installer id: ${packet.status}`);
  }

  // Save the device, zone, and site names. Each will throw an exception if not successful.
  await setName(device.serial, device.name, Messages.NAME_LIGHT, peripheral);
  await setName(device.serial, zoneData.name, Messages.NAME_ZONE, peripheral);
  await setName(device.serial, siteData.name, Messages.NAME_SITE, peripheral);

  // Save the zone id
  packet = await getData(device.serial, Messages.token.GET_NETWORK_SETTINGS, peripheral);
  if (!packet.isOK) throw new Error(`Unable to retrieve network settings: ${packet.status}`);
  const networkSettings = {
    ...packet.data,
    zone_id: device.zoneMeshId,
    network_key: siteData.network_key,
    pin_code: siteData.pin,
  };
  packet = await setData(
    device.serial,
    Messages.token.SET_NETWORK_SETTINGS,
    networkSettings,
    peripheral,
  );
  if (!packet.isOK) throw new Error(`Unable to set network settings: ${packet.status}`);

  // A reboot is required for these values to be realised on the device.
  // Do not require a response from a reboot as the device is rebooting so cannot respond.
  await reboot(device.serial, peripheral);
};

/**
 * Currently removing from the mesh and decommissioning the device
 * involves setting the zone_id back to the default zone id, and the site_id back to 0.
 *
 * @param  {} serial
 */
const removeFromMesh = async (serial) => {
  // Save the site id
  const siteIdData = new IMessages.U32_t();
  siteIdData.val = 0;
  await setData(serial, Messages.token.SET_SITE_ID, siteIdData);

  // Reset the name.
  await setName(serial, Constants.DEVICE.DEFAULT_NAME, Messages.NAME_LIGHT);
  await setName(serial, '', Messages.NAME_ZONE);
  await setName(serial, '', Messages.NAME_SITE);

  // Reset the zone id, PIN Code.
  const networkPacket = await getData(serial, Messages.token.GET_NETWORK_SETTINGS);
  if (!networkPacket.isOK) {
    throw new Error(`Unable to get the network settings: ${networkPacket.status}`);
  }
  const networkSettings = networkPacket.data;
  // NOTE: Do not reset the zone id back to default as it will not allow any of the
  // subsequent messages to route correctly.
  // networkSettings.zone_id = Messages.LUXSMART_COMM_ZONE_DEFAULT;
  networkSettings.pin_code = Constants.DEVICE.DEFAULT_PIN;
  const setNetworkPacket = await setData(
    serial,
    Messages.token.SET_NETWORK_SETTINGS,
    networkSettings,
  );
  if (!setNetworkPacket.isOK) {
    throw new Error(`Unable to set the network settings: ${setNetworkPacket.status}`);
  }

  // Reset the network_key back to default.
  const defaultPacket = await getData(serial, Messages.token.SET_DEFAULT);
  if (!defaultPacket.isOK) {
    throw new Error(`Unable to reset the network key: ${defaultPacket.status}`);
  }

  // reboot
  // Do not require a response from a reboot as the device is rebooting so cannot respond.
  await reboot(serial);
};

const getLampMaxPower = async (to, peripheral = null) => {
  const packet = await getData(to, Messages.token.GET_ENERGY_PIR_USAGE_FROM_BOOT, peripheral);
  if (!packet.isOK) {
    throw new Error("Unable to retrieve the lamp's max power");
  }
  return packet.data.power_rated_lamp_x_100;
};

/**
 * @param  {} to device or zone serial number
 * @param  {} pwmPercent % power
 * @returns packet
 */
const setPwm = async (to, pwmPercent) => {
  const settings = new IMessages.set_light_t();
  settings.manual = true; // set to SE_FALSE for AUTO
  settings.on = true; // or on/off for OFF or non-dimmable
  settings.pwm_percent_x_100 = pwmPercent * 100; // manual method is PWM for dimmable
  const packet = await setData(to, Messages.token.SET_AUTO_MANUAL, settings);
  return packet;
};
/**
 * Set a device to auto mode.
 * @param  {} to device or zone serial
 * @returns packet
 */
const setAuto = async (to) => {
  const settings = new IMessages.set_light_t();
  settings.manual = false; // set to SE_FALSE for AUTO
  settings.on = true;
  settings.pwm_percent_x_100 = 100 * 100;
  const packet = await setData(to, Messages.token.SET_AUTO_MANUAL, settings);
  return packet;
};

const setPowerPercent = async (to, maxPowerX100, powerPercent, peripheral = null) => {
  const data = new IMessages.temp_set_t();
  data.action = Messages.TEMP_SET_USE_POWER;
  data.power_x_100 = maxPowerX100 * (powerPercent / 100);
  data.minutes = 0;
  const packet = await setData(to, Messages.token.SET_TEMPORARY, data, peripheral);
  return packet;
};

const setOnOff = async (to, on = false, peripheral = null) => {
  const data = new IMessages.temp_set_t();
  data.action = Messages.TEMP_SET_USE_ON_OFF;
  data.on = on;
  data.minutes = 0;
  const packet = await setData(to, Messages.token.SET_TEMPORARY, data, peripheral);
  return packet;
};

/**
 * Get a device sensor data
 * @param  {} to device serial
 * @returns packet
 */
const getSensorData = async (to, peripheral = null) => {
  const packet = await getData(to, Messages.token.GET_SENSOR_DATA, peripheral);
  return packet;
};

/**
 * Get a device diagnostic data
 * @param  {} to device serial
 * @param  {} peripheral ble peripheral
 * @returns packet
 */
const getDiagnostics = async (to, peripheral = null) => {
  const packet = await getData(to, Messages.token.RUN_DIAGNOSTICS, peripheral);
  return packet;
};

/**
 * Get a device settings data
 * @param  {} to device serial
 * @returns packet
 */
const getSettings = async (to) => {
  const packet = await getData(to, Messages.token.GET_SETTINGS);
  return packet;
};

/**
 * Get a device diagnostic data
 * @param  {} to device serial
 * @param  {} peripheral ble peripheral
 * @returns packet
 */
const getInfo = async (to, peripheral) => {
  const packet = await getData(to, Messages.token.GET_INFO, peripheral);
  return packet;
};

const setCalibrationTable = async (to, table, entryNumber = 0, peripheral = null) => {
  const entry = table.t[entryNumber]; // entry is IMessages.table_item_t
  const packet = await setData(to, Messages.token.SET_CALIBRATION_TABLE, entry, peripheral);
  if (!packet.isOK) {
    throw new Error(`Error while setting the calibration table entry ${entryNumber}. Status: ${packet.status}`);
  }
  LOG.console(entry);
  const nextEntry = entryNumber + 1;
  if (nextEntry < table.entries) {
    await setCalibrationTable(to, table, nextEntry, peripheral);
  }
};
/**
 *  * const table_t lux_table_default = {
     .entries = LUXSMART_CALIBRATION_TABLE_ENTRIES,
     {
       {.entry = 0, .lux_min = 0,   .lux_max = 100,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 1, .lux_min = 100, .lux_max = 200,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 2, .lux_min = 200, .lux_max = 300,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 3, .lux_min = 300, .lux_max = 400,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 4, .lux_min = 400, .lux_max = 500,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 5, .lux_min = 500, .lux_max = 600,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 6, .lux_min = 600, .lux_max = 700,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 7, .lux_min = 700, .lux_max = 800,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 8, .lux_min = 800, .lux_max = 900,  .m_x_1000 = 1000, .b_x_1000 = 0},
       {.entry = 9, .lux_min = 900, .lux_max = 1000, .m_x_1000 = 1000, .b_x_1000 = 0},
     }
};
 */
const generateDefaultCalibrationTable = () => {
  const table = new IMessages.table_t();
  table.entries = 0;
  for (let i = 0; i < 10; i += 1) {
    const itm = new IMessages.table_item_t();
    itm.entry = i;
    itm.lux_min = i * 100;
    itm.lux_max = (i + 1) * 100;
    itm.m_x_1000 = 1000;
    itm.b_x_1000 = 0;
    table.t.push(itm);
    table.entries += 1;
  }
  return table;
};

/**
 * @param  {} to serial number of device
 */
const setDefaultCalibrationTable = async (to, peripheral = null) => {
  const table = generateDefaultCalibrationTable();
  await setCalibrationTable(to, table, 0, peripheral);
};

/**
 * First Step m[0] = (phone[0] - 0)/(lamp[0] - 0)
 *                  b[0] = phone[0] - m[0]*lamp[0]
 *                 Lux_min[0] = 0
 *                 Lux_max[0] = lamp[0]
 * Next Step m[1] = (phone[1]-phone[0])/(lamp[1]-lamp[0])
 *                 b[1] = phone[1] - m[1]*lamp[1]
 *                 Lux_min[1] =  lamp[0]
 *                 Lux_max[1] = lamp[1]
 * ...
 * Final Step m[9] = (phone[9]-phone[8])/(lamp[9]-lamp[8])
 *                 b[9] = phone[9] - m[9]*lamp[9]
 *                 Lux_min[9] =  lamp[8]
 *                 Lux_max[9] = UINT16_MAX or something unreachable
 *
 * @param  {} recordings Array of { luxPhone, luxLamp } readings.
 */
const generateCalibrationTable = (recordings) => {
  // Set the calibration table entry
  const table = new IMessages.table_t();
  table.entries = Messages.LUXSMART_CALIBRATION_TABLE_ENTRIES; // 10

  // We start at 1 as the first entry is there as an ambient measure which allows the
  // calculation of subsequent entries. It should be discarded once the other table entries have
  // been calculated.

  for (let i = 1; i < recordings.length; i += 1) {
    const item = new IMessages.table_item_t();
    item.entry = i - 1; // 0 based int, will be a value 0 to 9.
    const prevLuxPhone = recordings[i - 1].luxPhone;
    const prevLuxLamp = recordings[i - 1].luxLamp;
    const rec = recordings[i];

    // Make sure these values are equal or larger than the base ambient (or previous reading).
    // If they are smaller there is an issue in the procedure.
    if (rec.luxPhone < prevLuxPhone) {
      LOG.console(`Phone recording invalid lux levels. Please try again. Phone: ${
        rec.luxPhone
      }, Previous Phone Reading: ${prevLuxPhone}`);
      throw new Error('Phone recorded invalid lux. Please try again.');
    }
    if (rec.luxLamp < prevLuxLamp) {
      LOG.console(`Lamp recorded invalid lux. Please try again. Lamp: ${
        rec.luxLamp
      }, Previous Lamp Reading: ${prevLuxLamp}`);
      throw new Error('Lamp recorded invalid lux. Please try again.');
    }

    const m = (rec.luxPhone - prevLuxPhone) / (rec.luxLamp - prevLuxLamp); // Slope (m) = (y2 - y1) / (x2 - x1)
    item.m_x_1000 = m * 1000;
    const b = rec.luxPhone - m * rec.luxLamp; // y intercept at zero
    item.b_x_1000 = b * 1000;
    item.lux_min = prevLuxLamp; // Prev lamp reading
    item.lux_max = rec.luxLamp; // This lamp reading

    if (i === recordings.length - 1) {
      // Set the last lux max to somthing unreachable.
      item.lux_max = 99999;
    }
    table.t.push(item);
  }

  return table;
};

const getLogs = async (to, maxResults = 100) => {
  // First get the log count.
  const countPacket = await getData(to, Messages.token.GET_LOG_COUNT);
  if (!countPacket.isOK) {
    throw new Error(`There was a problem getting the log count. Status: ${countPacket.status}`);
  }
  const logCount = countPacket.data.val;
  const maxToRequest = logCount > maxResults ? maxResults : logCount;
  const receivedCount = logCount - maxToRequest; // Get the last 100 for now..

  // Then get the logs by asking for a range.
  const range = new IMessages.item_range_request_t(receivedCount, maxToRequest);

  // Get multiple response packts.
  const results = await setData(to, Messages.token.GET_LOG, range, null, null, maxToRequest);
  if (results.length !== maxToRequest) {
    throw new Error('There was a problem getting the all the log items.');
  }

  return results;
};

const getEnergyLogs = async (to) => {
  const results = await getLogs(to, 50);
  const resultData = results.map(r => r.data);
  const filteredLogs = resultData.filter(d => d.event === IMessages.log_t.log_event_e.e_timed_energy_level);
  LOG.console('Energy logs', filteredLogs);
  const energyData = filteredLogs.map(l => ({
    minute: Math.ceil(l.seconds / 60),
    value: l.value || 0,
  }));

  return energyData;
};

const disconnect = async (id) => {
  const manager = loadDeviceManager();
  await manager.disconnect(id);
};

export default {
  addToMesh,
  removeFromMesh,
  zoneValueSet,
  deviceValueSet,
  delay,
  loadDeviceManager,
  stopDeviceManager,
  processNotification,
  getData,
  setData,
  writeWithoutResponse,
  writeWithoutNotification,
  getConnected,
  getDiscovered,
  getConnectionCandidate,
  setPwm,
  setAuto,
  setPowerPercent,
  getLampMaxPower,
  getSensorData,
  setCalibrationTable,
  setDefaultCalibrationTable,
  generateCalibrationTable,
  generateDefaultCalibrationTable,
  getLogs,
  getEnergyLogs,
  createPacket,
  reboot,
  getDiagnostics,
  getSettings,
  getInfo,
  isConnected,
  disconnect,
  setOnOff,
  isAuthenticated,
  authenticate,
};
