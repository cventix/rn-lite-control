//
// File: config/firebase.js
//

//
// This code creates an instance of the Firebase SDK and configures it with your config.
// Now you can import it anywhere in your codebase and it’s always this singleton.
// When you see firebase from now on, assume that it’s imported from here.
//
// import * as firebase from 'firebase';
// const firebase = require('firebase');
// require('firebase/firestore');
// require('firebase/database');
// import firebase from 'react-native-firebase';

import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import '@react-native-firebase/storage';

// import {
//   FIREBASE_API_KEY,
//   FIREBASE_AUTH_DOMAIN,
//   FIREBASE_DATABASE_URL,
//   FIREBASE_PROJECT_ID,
//   FIREBASE_STORAGE_BUCKET,
//   FIREBASE_MESSAGING_SENDER_ID,
// } from './';

// Initialize Firebase
// const config = {
//   apiKey: FIREBASE_API_KEY,
//   authDomain: FIREBASE_AUTH_DOMAIN,
//   databaseURL: FIREBASE_DATABASE_URL,
//   projectId: FIREBASE_PROJECT_ID,
//   storageBucket: FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
// };

// firebase.initializeApp(config);
// Chunk of test code for firestore strangeness.
// const fbapp = firebase.initializeApp(config);
// console.log(fbapp.options);
// const db = fbapp.firestore();
// console.log('about to test firestore');
// db
//   .collection('sites')
//   .doc('joOi5XfErwRAEAJQqB0e')
//   .get()
//   .then((doc) => {
//     console.log('fbapp get', doc.data());
//   })
//   .catch((err) => {
//     console.log('fbapp err', err);
//   });

export default firebase;
