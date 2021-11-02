//
// File: sagas/authApi.js
//

import * as GoogleSignIn from 'expo-google-sign-in';
import * as Facebook from 'expo-facebook';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import firebase from '../config/firebase';
import config from '../config/config.dev';
import string from '../utils/string';
import LocalStorage from '../lib/Categories/LocalStorage';

const auth = firebase.auth();

// Sign the user in with their email and password
export const doLogin = (email, password) => auth.signInWithEmailAndPassword(email, password);

// Register the user using email and password
export const doRegister = (email, password) => auth.createUserWithEmailAndPassword(email, password);

// Register the user using email and password
export const doSendVerificationEmail = user => user.sendEmailVerification();

// Sign Out
export const doSignOut = async () => {
  return Promise.all([auth.signOut(), GoogleSignIn.signOutAsync()]);
};

// Reset password
export const doResetPassword = email => auth.sendPasswordResetEmail(email);

export const doLoginGoogle = async () => {
  try {
    await GoogleSignIn.askForPlayServicesAsync();
    const { type, user } = await GoogleSignIn.signInAsync();
    if (type === 'success') {
      return GoogleSignIn.signInSilentlyAsync();
    }
  } catch ({ message }) {
    alert('login: Error:' + message);
  }
};

export const doLoginGoogleFirebase = token => {
  // Send null as idToken as we do not need it.
  const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
  return auth.signInWithCredential(credential);
};

export const doLoginFacebook = () =>
  Facebook.logInWithReadPermissionsAsync(config.FACEBOOK_APP_ID, {
    permissions: ['public_profile'],
  });

export const doLoginFacebookFirebase = token => {
  const credential = firebase.auth.FacebookAuthProvider.credential(token);
  return auth.signInWithCredential(credential);
};

export const doLoginApple = async () => {
  try {
    const credential = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // signed in
    if (credential.user) {
      const { identityToken, nonce } = credential;
      return { identityToken, nonce };
    }
  } catch (e) {
    throw Error(e.message);
  }
};

export const doLoginAppleFirebase = async ({ identityToken, nonce }) => {
  const credential = firebase.auth.AppleAuthProvider.credential(identityToken, nonce);
  return auth.signInWithCredential(credential);
};

export const doSaveUser = async user => {
  const db = firebase.firestore();
  const docRef = db.collection('users');

  let providerData = null;
  if (user.providerData && user.providerData.length) {
    // Convert to normal js object.
    providerData = user.providerData.map(p => Object.assign({}, p));
  }

  const dbUser = await docRef.doc(user.uid).get();
  let debug = dbUser.get('debug');
  if (debug === undefined) {
    debug = false;
  }
  LocalStorage.setItem('DEBUG', debug);

  dbUser.ref.set(
    {
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata.creationTime,
      // lastSignInTime: user.metadata.lastSignInTime,
      lastSignInTime: firebase.firestore.FieldValue.serverTimestamp(),
      providerData,
      installer_id: string.hashCode(user.uid),
      debug,
    },
    { merge: true }
  );
  return dbUser;
};
