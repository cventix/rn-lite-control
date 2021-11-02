//
// File: config/config.dev.js
//
export const FIREBASE_API_KEY = 'AIzaSyBzZ4-yMH6vSNSHNowcJMkgPKI44VojC6s';
export const FIREBASE_AUTH_DOMAIN = 'luxsmartcontroller-196104.firebaseapp.com';
export const FIREBASE_DATABASE_URL = 'https://luxsmartcontroller-196104.firebaseio.com';
export const FIREBASE_PROJECT_ID = 'luxsmartcontroller-196104';
export const FIREBASE_STORAGE_BUCKET = 'luxsmartcontroller-196104.appspot.com';
export const FIREBASE_MESSAGING_SENDER_ID = '162033661894';

const FACEBOOK_APP_ID = '1201577103312511';
const GOOGLE_IOS_STANDALONE_APP_CLIENT_ID =
  '162033661894-4jahomiq9ubhqdplj7e03a4s8h0oi2po.apps.googleusercontent.com';

//
// Android client id's need to be generated from the APK build key using the
// https://console.developers.google.com/apis/credentials pae.
//
// DEVELOPMENT APKs
// debug.keystore client id
// const GOOGLE_ANDROID_STANDALONE_APP_CLIENT_ID =
//  '162033661894-sihblm7oojt7er0io4kkrptedk7rpp84.apps.googleusercontent.com';
//
// PRODUCTION APKs
// This is the luxsmart-upload-key.keystore generated client id.
const GOOGLE_ANDROID_STANDALONE_APP_CLIENT_ID =
  '162033661894-jvlpivrj5f299frnfqjnlcoh2omlmau9.apps.googleusercontent.com';

const GOOGLE_WEB_CLIENT_ID =
  '162033661894-0ritn66l15nhifatjo0s36vtqjh11817.apps.googleusercontent.com';

export default {
  // Setting the API to non-localhost allows other devices on network to demo app using Expo client.
  // API_URL=http://localhost:3000
  API_URL: 'http://192.168.0.9:3000',
  GOOGLE_IOS_STANDALONE_APP_CLIENT_ID,
  GOOGLE_ANDROID_STANDALONE_APP_CLIENT_ID,
  FACEBOOK_APP_ID,
  GOOGLE_WEB_CLIENT_ID,
};
