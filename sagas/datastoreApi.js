//
// File: sagas/datastoreApi.js
//
import { Messages } from 'luxsmart-comms';
import firebase from '../config/firebase';
import string from '../utils/string';
import LOG from '../utils/LOG';

const db = firebase.firestore();

export const getSite = siteid =>
  db
    .collection('sites')
    .doc(siteid)
    .get();

export const getUserSites = async (userRef) => {
  if (!userRef) return null;
  const userSites = await db
    .collection('sites')
    .where('userRef', '==', userRef)
    .get();
  return userSites;
};

export const getDevices = siteRef => siteRef.collection('devices');

export const getZones = siteRef => siteRef.collection('zones');

export const getSwitches = siteRef => siteRef.collection('switches');

/**
 * Save a set of device fields to the site device.
 *
 * @param  {string} siteid of the site to save the device settings to.
 * @param  {string} deviceid usually retrieved directly from the mesh device.
 * @param  {object} fields the device fields to save, {key: val, key: val, ...}
 */
export const saveDevice = async (siteid, deviceid, fields) => {
  const siteSS = await getSite(siteid);
  const deviceQuerySS = await siteSS.ref
    .collection('devices')
    .where('id', '==', deviceid)
    .get();

  // We get the first document here as there may be multiple due to
  // testing and stale data.
  const deviceSS = deviceQuerySS.docs[0];
  await deviceSS.ref.set(fields, { merge: true });
  const newDeviceDoc = await deviceSS.ref.get();

  return newDeviceDoc;
};

export const getDeviceSite = async (serial) => {
  try {
    const docRef = await db
      .collection('sitedevices')
      .doc(string.asHex(serial))
      .get();

    if (!docRef.exists) return null;

    const deviceSite = docRef.data();
    const siteRef = await deviceSite.siteRef.get();

    if (!siteRef.exists) return null;

    return { doc: siteRef, key: siteRef.id, ...siteRef.data() };
  } catch (err) {
    LOG.console(err);
    return null;
  }
};

export const getSitesForDevices = async (devices) => {
  const deviceList = await Promise.all(devices.map(async (d) => {
    const deviceSite = await getDeviceSite(d.serial);
    if (deviceSite) {
      const device = { siteid: deviceSite.key, siteName: deviceSite.name, ...d };
      return device;
    }
    return null;
  }));
  const devicesWithSites = deviceList.filter(d => d !== null);
  return devicesWithSites;
};

export const deleteFromSiteDevices = async (serial) => {
  const docRef = await db
    .collection('sitedevices')
    .doc(string.asHex(serial))
    .get();
  if (docRef.exists) {
    docRef.ref.delete();
  }
};

export const addToSiteDevices = (siteRef, serial) => {
  db.collection('sitedevices')
    .doc(string.asHex(serial))
    .set({ siteRef: siteRef.ref });
};

export const deleteDevice = async (item) => {
  await deleteFromSiteDevices(item.serial);
  await item.doc.ref.delete();
};

const getDevicesInZone = (siteDevices, discoveredDevices, zoneRef) => {
  let devices = siteDevices.filter(d => d.doc.data().zoneid === zoneRef.id);
  // Enhance the device with connected status if we know it.
  devices = devices.map((d) => {
    const bleDevice = discoveredDevices.find(ble => ble.serial === d.serial);
    if (bleDevice) return { ...d, connected: bleDevice.connected };
    return d;
  });
  return devices;
};

/**
 * NOTE: Messages.token.SET_SETTINGS requries the entire settings object to be sent,
 * even if we just want to change one value.
 *
 * @param  {} settings to update
 * @returns {} updated IMessages.device_settings_t object.
 */
const generateSettings = (settings) => {
  const deviceSettings = {
    // ...this.props.deviceSettings,
    ...settings,
    time_ramp_down: 5, // Default
    time_ramp_up: 0, // Default
    lux_saving: 0,
    lux_PIR_expired: 0,
    logging_period_min_power: 1,
  };

  return deviceSettings;
};

const sortNumDesc = (a, b) => {
  if (a > b) return -1;
  if (a < b) return 1;
  return 0;
};

const sortNameDesc = (a, b) => {
  if (a.name.indexOf('L:') !== -1 && b.name.indexOf('L:') !== -1) {
    const numA = Number(a.name.split(':')[1]);
    const numB = Number(b.name.split(':')[1]);
    return sortNumDesc(numA, numB);
  }
  // If there is no light number prefix, then push to bottom of list sorted in ascending order.
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
};

const provisionDevice = (item, siteRef, zoneDevices, zoneRef, zoneSettingsKeys, deviceInfoData) => {
  const devices = zoneDevices.filter(d => /L:\d{1,}$/g.test(d.name));

  // The devices are sorted in the reducer by calibrated status, then name.
  // This does not make sense for determining the device name so resort based
  // on name.
  const sortedDevices = devices.sort(sortNameDesc);
  const lastDevice = sortedDevices[0];
  const zoneData = zoneRef.data();
  let deviceNumber = 1;

  if (lastDevice) {
    const segments = lastDevice.name.split(':');
    deviceNumber = Number(segments[segments.length - 1]) + 1;
  }
  let name = `L:${deviceNumber}`;

  // Add some name length safety.
  if (name.length > Messages.NAME_STRING_SIZE) {
    // Trim from the left.
    name = name.substring(name.length - Messages.NAME_STRING_SIZE);
  }

  // Copy the relevant zone settings defined in this.settings onto
  // this new device and add it to the mesh and to firestore.
  const settings = {};
  zoneSettingsKeys.forEach(k => (settings[k] = zoneData[k]));

  const device = {
    ...item,
    name,
    zoneid: zoneRef.id, // Firestore id
    zoneMeshId: zoneData.meshId, // zone id used to communicate to devices in zone.
    siteMeshId: siteRef.data().meshId,
    settings: generateSettings(settings),
  };

  // Remember the previous calibration status.
  if (deviceInfoData) {
    device.calibrated = deviceInfoData.calibrated;
  }

  // Clean the device object before saving it.
  delete device.connected;
  delete device.advertising;
  delete device.rssi;
  delete device.signal;

  return device;
};

const saveProvisionedDevice = (device, siteRef) => {
  // Add the device to the site's devices collection.
  siteRef.ref.collection('devices').add(device);

  // Add the device serial and site ref to the sitedevices collection for quick lookup ability.
  addToSiteDevices(siteRef, device.serial);
};

export default {
  generateSettings,
  provisionDevice,
  saveProvisionedDevice,
  getDevicesInZone,
  deleteFromSiteDevices,
  addToSiteDevices,
  getDeviceSite,
  getSitesForDevices,
  deleteDevice,
};
