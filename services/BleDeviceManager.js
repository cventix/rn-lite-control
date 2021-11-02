import { NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { stringToBytes } from 'convert-string';
import LOG from '../utils/LOG';

export default class BleDeviceManager {
  constructor(
    service,
    notificationCharacteristic,
    writeCharacteristic,
    nameFilters = null,
    serviceFilters = [],
  ) {
    this.service = service;
    this.notificationCharacteristic = notificationCharacteristic;
    this.writeCharacteristic = writeCharacteristic;
    this.nameFilters = nameFilters;
    this.serviceFilters = serviceFilters;

    this.manager = BleManager;
    this.bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
    this.listeners = [];
    this.connected = [];

    this.peripheralNames = {};

    this.workerQueue = [];
    this.isWorkerQueueHandlerRunning = false;

    this.notificationProcessorQeueue = new Map();

    this.bleEnabled = false;
  }
  /**
   * Single log pipe to easy disable when needing to clean up console.
   * @param  {} args
   */
  static log(...args) {
    const DEBUG = true;
    if (DEBUG) {
      LOG.console('BleManager:', ...args);
    }
  }

  static getBestName(peripheral) {
    if (peripheral.advertising) return peripheral.advertising.localName;
    return peripheral.name;
  }

  delay = duration =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, duration);
    });

  shouldFilterOut(event, eventData) {
    // If there is no filter defined or nothing to filter against then nothing to to.
    if (!this.nameFilters || !eventData) return false;
    // Only filter discovery events.
    if (event !== 'BleManagerDiscoverPeripheral') return false;
    // Only allow ble peripherals with a name
    if (!eventData.name) return true;

    if (
      !this.nameFilters.find(filter =>
      // eventData.name.toLowerCase().startsWith(filter.toLowerCase()))
        eventData.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
    ) {
      // The event data name does not exist in the defined filter so this is not OK.
      return true;
    }

    // Default to not filtering out.
    return false;
  }

  handleDiscoverPeripheral = (peripheral) => {
    const eventName = 'BleManagerDiscoverPeripheral';

    if (!this.shouldFilterOut(eventName, peripheral)) {
      this.constructor.log(eventName, peripheral);
      // this.peripheralNames[peripheral.id] = peripheral.name;
      // localName is the customised name of the device.
      // name is the factory device name.
      this.peripheralNames[peripheral.id] = this.constructor.getBestName(peripheral);
    }
  };

  handleUpdateValueForCharacteristic = (data) => {
    this.notificationProcessorQeueue.forEach((fn, id) => {
      if (fn(data)) {
        // Remove from the processor queue.
        this.notificationProcessorQeueue.delete(id);
      }
      // Else leave in the queue for the next notification.
    });
    // this.constructor.log(`DidUpdateValueForCharacteristic ${data.peripheral} ${response}`);
  };

  handleConnectedPeripheral = (data) => {
    this.constructor.log('ConnectPeripheral', data);

    // Add the peripheral to the internal connected array to avoid multiple connections.
    // Peripherals get removed from this array in the DisconnectPeripheral event handler.
    if (!this.isConnected(data.peripheral)) {
      this.connected.push(data.peripheral);
    }
  };

  handleDisconnectedPeripheral = (data) => {
    this.connected = this.connected.filter(c => c !== data.peripheral);
    this.constructor.log('DisconnectPeripheral', data);
  };

  handleStopScan = () => {
    this.constructor.log('StopScan');
  };

  handleDidUpdateState = (data) => {
    this.constructor.log('DidUpdateState', data);
    this.bleEnabled = data.state === 'on';
    // Always perform at least one scan to ensure that
    // connections are never attempted before a scan.
    if (this.bleEnabled) {
      this.scan();
    }
  };

  start() {
    this.constructor.log('Starting');
    this.manager.start({ showAlert: false, forceLegacy: true });
  }

  listen() {
    this.constructor.log('Listening for BLE events...');
    this.on('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral);
    this.on('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);
    this.on('BleManagerConnectPeripheral', this.handleConnectedPeripheral);
    this.on('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral);
    this.on('BleManagerStopScan', this.handleStopScan);
    this.on('BleManagerDidUpdateState', this.handleDidUpdateState);
    this.manager.checkState();
  }

  on(event, handler) {
    this.constructor.log(`Adding ${event} listener`, handler);
    const remove = this.bleManagerEmitter.addListener(event, handler);
    this.listeners.push(remove);

    return remove;
  }

  removeListeners() {
    this.constructor.log(`Removing ${this.listeners.length} listeners`);
    this.listeners.forEach(l => l.remove());
  }

  /**
   * Has the device been connected in this app session.
   *
   * @param  {} peripheralId
   */
  isConnected(peripheralId) {
    return this.connected.some(d => d === peripheralId);
  }

  /**
   * Return devices that have been connected in this app session (no restarts)
   */
  getConnectedInSession() {
    return this.connected;
  }

  getPeripheralName(id) {
    return this.peripheralNames[id];
  }

  addToNotificationProcessorQueue(id, fn) {
    this.notificationProcessorQeueue.set(id, fn);
  }

  removeFromNotificationProcessorQueue(id) {
    this.notificationProcessorQeueue.delete(id);
  }

  /**
   * Add a function to the worker queue
   * @param  function fn
   */
  async addToQueue(fn) {
    if (!this.isWorkerQueueHandlerRunning) {
      await this.processMessage(fn);
    } else {
      this.workerQueue.push(fn);
    }
  }

  async processMessage(fn) {
    this.isWorkerQueueHandlerRunning = true;

    try {
      await fn();
    } catch (err) {
      this.constructor.log('Error processing message in queue', err);
      // Clear the rest of the messaegs.
      this.workerQueue = [];
      this.isWorkerQueueHandlerRunning = false;
      // Disconnect all so the next attempt connects again.
      await this.disconnectAll();
    }

    if (this.workerQueue.length) {
      const next = this.workerQueue.shift();
      await this.processMessage(next);
    } else {
      this.isWorkerQueueHandlerRunning = false;
    }
  }

  async getConnected() {
    // The service filter does not work in the bluetooth lib, so implement our own.
    const connected = await this.manager.getConnectedPeripherals([]);
    const ourDevices = connected.filter((c) => {
      if (this.shouldFilterOut('BleManagerDiscoverPeripheral', c)) {
        return false;
      }
      this.peripheralNames[c.id] = this.constructor.getBestName(c);
      return true;
    });
    return ourDevices;
  }

  async disconnect(id) {
    try {
      this.constructor.log('Disconnecting', id);
      await this.manager.disconnect(id);
    } catch (err) {
      this.constructor.log('Error disconnecting', err);
      // Disconnect sometimes thinks the device is not connected.
      // Fire the disconnect event manually.
      this.bleManagerEmitter.emit('BleManagerDisconnectPeripheral', { peripheral: id });
    }
  }

  async disconnectAll() {
    const { connected } = this;
    await Promise.all(connected.map(async (c) => {
      await this.disconnect(c);
    }));
  }

  // This requires a connection.
  async readRSSI(id) {
    try {
      const rssi = await this.manager.readRSSI(id);
      return rssi;
    } catch (err) {
      this.constructor.log('Error reading rssi', err);
    }
    return 0;
  }

  scan() {
    this.addToQueue(() => {
      try {
        this.manager.scan(this.serviceFilters, 5, false).then(() => {
          this.constructor.log('Scanning for devices...');
        });
      } catch (e) {
        this.constructor.log('Error Scanning', e);
      }
    });
  }

  async getDiscovered() {
    let discovered = await this.manager.getDiscoveredPeripherals();

    // remove any discovered items that are not in the filter
    discovered = discovered.filter(d => !this.shouldFilterOut('BleManagerDiscoverPeripheral', d));

    // Update the discovered objects with some additional name data
    // as this is not included in the API.
    discovered.forEach((d) => {
      this.peripheralNames[d.id] = this.constructor.getBestName(d);
    });

    this.constructor.log('getDiscovered', discovered);
    return discovered;
  }
  /**
   * Connect to a peripheral.
   *
   * @param  {} peripheralId The BLE id of the peripheral
   * @param  function onConnect Callback function to run after a successful connection.
   */
  connect(peripheralId, onConnect) {
    this.addToQueue(async () => {
      await this.connectNow(peripheralId, onConnect);
    });
  }

  async connectNow(peripheralId, onConnect) {
    if (!peripheralId) return;

    if (this.isConnected(peripheralId)) {
      // Double check..
      const isConnected = await this.manager.isPeripheralConnected(peripheralId, []);
      if (isConnected) {
        return;
      }
    }

    this.constructor.log('Connecting to', peripheralId);
    // Force a timeout on connection as it will not fail if it cannot connect.
    let isConnected = false;
    const connAttempt = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!isConnected) {
          reject(new Error(`Could not connect to ${peripheralId}`));
        }
      }, 10000);
      this.manager.connect(peripheralId).then(() => {
        isConnected = true;
        resolve('Connected');
      });
    });
    await connAttempt;

    // Give the stack some time to catch up. Particularly important on Android.
    await this.delay(500);

    const services = await this.manager.retrieveServices(peripheralId);
    this.constructor.log('Services available', services);

    // Give the stack some time to catch up. Particularly important on Android.
    await this.delay(400);

    await this.manager.startNotification(
      peripheralId,
      this.service,
      this.notificationCharacteristic,
    );
    this.constructor.log('Notification Started on', peripheralId, this.notificationCharacteristic);

    // Give the stack some time to catch up. Particularly important on Android.
    await this.delay(500);

    // If a function has been passed in we can execute it after a successful connection.
    if (onConnect) await onConnect();
  }

  async writeNowWithoutNotification(
    peripheralId,
    hexData,
    maxByteSize = null,
    queueSleepTime = null,
    attempt = 0,
  ) {
    const maxAttempts = 3;
    if (this.isConnected(peripheralId)) {
      const data = stringToBytes(hexData);
      // this.constructor.log('WriteWithoutResponse', peripheralId, hexData);
      await this.manager.writeWithoutResponse(
        peripheralId,
        this.service,
        this.writeCharacteristic,
        data,
        maxByteSize,
        queueSleepTime,
      );
    } else if (attempt < maxAttempts) {
      this.constructor.log(`Cannot writeNowWithoutNotification as ${peripheralId} has disconnected`);
      this.constructor.log(`Reconnecting to ${peripheralId}`);
      await this.connectNow(peripheralId, async () => {
        this.constructor.log(`Rewriting ${hexData}`);
        await this.writeNowWithoutNotification(
          peripheralId,
          hexData,
          maxByteSize,
          queueSleepTime,
          attempt + 1,
        );
      });
    } else {
      this.constructor.log(`writeNowWithoutNotification aborted after ${attempt + 1} attempts.`);
    }
  }

  async writeNow(peripheralId, hexData, attempt = 0) {
    const maxAttempts = 3;
    if (this.isConnected(peripheralId)) {
      const data = stringToBytes(hexData);
      // this.constructor.log('Writing', peripheralId, hexData);
      await this.manager.write(peripheralId, this.service, this.writeCharacteristic, data);
    } else if (attempt < maxAttempts) {
      this.constructor.log(`Cannot writeNow as ${peripheralId} has disconnected`);
      this.constructor.log(`Reconnecting to ${peripheralId}`);
      await this.connectNow(peripheralId, async () => {
        this.constructor.log(`Rewriting ${hexData}`);
        await this.writeNow(peripheralId, hexData, attempt + 1);
      });
    } else {
      this.constructor.log(`writeNow aborted after ${attempt + 1} attempts.`);
    }
  }

  writeWithoutNotification(
    peripheralId,
    hexData,
    maxByteSize = null,
    queueSleepTime = null,
    onBeforeWrite = null,
    onAfterWrite = null,
  ) {
    this.addToQueue(async () => {
      if (onBeforeWrite) await onBeforeWrite();
      await this.writeNowWithoutNotification(peripheralId, hexData, maxByteSize, queueSleepTime);
      if (onAfterWrite) await onAfterWrite();
    });
  }

  write(peripheralId, hexData, onBeforeWrite = null, onAfterWrite = null) {
    this.addToQueue(async () => {
      if (onBeforeWrite) await onBeforeWrite();
      await this.writeNow(peripheralId, hexData);
      if (onAfterWrite) await onAfterWrite();
    });
  }
}
