//
// File: utils/LOG.js
//
import Constants from 'expo-constants';
import firebase from '../config/firebase';
import LocalStorage from '../lib/Categories/LocalStorage';
import { getCurrentPhone } from '../sagas/phone';
import date from '../utils/datetime';

const logInProd = false;
const db = firebase.firestore();
const auth = firebase.auth();

/**
 * Single console.log pipe to easy disable when needing to clean up console.
 * @param  {} args
 */
const c = (...args) => {
  if (!__DEV__ && !logInProd) return;
  console.log(date.datetimeseconds(Date.now()), ...args);
};

const packet = async (
  hardware_version = null,
  firmware_version = null,
  thePacket,
  type = 'packet',
  bleId = null,
  bleName = null,
) => {
  if (!LocalStorage.getItem('DEBUG')) return;
  const phone = await getCurrentPhone();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  db.collection('log').add({
    timestamp,
    type,
    ConnectedBleID: bleId,
    ConnectedBleName: bleName,
    hardware_version,
    firmware_version,
    to: `0x${Number(thePacket.to).toString(16)}`,
    from: `0x${Number(thePacket.from).toString(16)}`,
    token: `0x${Number(thePacket.token).toString(16)}`,
    message: thePacket.tokenString || 'UNKNOWN',
    status: thePacket.status,
    sequence: thePacket.sequence,
    dataLength: thePacket.dataLength,
    data: JSON.stringify(thePacket.data),
    raw: thePacket.hexData,
    phoneBrand: phone.brand,
    phoneModel: phone.model,
    phoneSystemName: phone.systemName,
    phoneSystemVersion: phone.systemVersion,
    sessionId: Constants.sessionId,
    userId: auth.currentUser.uid,
  });
};

const ble = async (bleId, bleName, type) => {
  if (!LocalStorage.getItem('DEBUG')) return;
  const phone = await getCurrentPhone();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  db.collection('log').add({
    timestamp,
    type,
    ConnectedBleID: bleId,
    ConnectedBleName: bleName,
    phoneBrand: phone.brand,
    phoneModel: phone.model,
    phoneSystemName: phone.systemName,
    phoneSystemVersion: phone.systemVersion,
    sessionId: Constants.sessionId,
    userId: auth.currentUser.uid,
  });
};

const debug = async (message, payload) => {
  const phone = await getCurrentPhone();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  db.collection('debugger').add({
    timestamp,
    message,
    payload,
    phoneBrand: phone.brand,
    phoneModel: phone.model,
    phoneSystemName: phone.systemName,
    phoneSystemVersion: phone.systemVersion,
    sessionId: Constants.sessionId,
    userId: auth.currentUser.uid,
  });
};

export default {
  console: c,
  packet,
  ble,
  debug
};
