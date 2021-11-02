//
// File: sagas/auth.js
//
import { put, takeEvery, call, fork } from 'redux-saga/effects';

import * as api from './authApi';
import { actionTypes as t } from '../reducers';
import NavigatorService from '../services/navigator';
import LOG from '../utils/LOG';

const providerFirebaseLogin = function* providerFirebaseLogin(action, type, accessToken, apiFn) {
  if (type === 'success') {
    const login = yield call(apiFn, accessToken);
    yield put({ type: t.auth.DO_LOGIN_SUCCESS, payload: login.user });
    // Redirect
    yield call(NavigatorService.navigate, action.isFirstLogin ? 'SiteTutorial' : 'App');
  } else {
    // Error
    yield put({
      type: t.auth.DO_LOGIN_FAILED,
      payload: { messsage: 'Unable to login.' },
    });
  }
};

const watchLoginProvider = function* watchLoginProvider() {
  yield takeEvery(t.auth.DO_LOGIN_PROVIDER, function* loginProvider(action) {
    yield put({ type: t.auth.DO_LOGIN_STARTED });

    try {
      switch (action.provider) {
        case 'google': {
          // First retrieve token
          const { auth } = yield call(api.doLoginGoogle);
          const { accessToken } = auth;
          // Then sign into firebase with token.
          yield call(
            providerFirebaseLogin,
            action,
            accessToken ? 'success' : null,
            accessToken,
            api.doLoginGoogleFirebase
          );
          break;
        }
        case 'facebook': {
          // First retrieve token
          const { type, token } = yield call(api.doLoginFacebook);
          // Then sign into firebase with token.
          yield call(providerFirebaseLogin, action, type, token, api.doLoginFacebookFirebase);
          break;
        }
        case 'apple': {
          // First retrieve token
          const credentials = yield call(api.doLoginApple);
          // Then sign into firebase with token.
          yield call(
            providerFirebaseLogin,
            action,
            credentials && credentials.identityToken ? 'success' : null,
            credentials,
            api.doLoginAppleFirebase
          );
          break;
        }
        default: {
          // error
          yield put({ type: t.auth.DO_LOGIN_FAILED, message: 'Unknown provider' });
          break;
        }
      }
    } catch (error) {
      LOG.console('error', error);
      yield put({ type: t.auth.DO_LOGIN_FAILED });
    }
  });
};

const watchLogin = function* watchLogin() {
  yield takeEvery(t.auth.DO_LOGIN, function* login(action) {
    yield put({ type: t.auth.DO_LOGIN_STARTED });
    try {
      const { user } = yield call(api.doLogin, action.payload.username, action.payload.password);
      if (user) {
        if (user.emailVerified) {
          yield put({ type: t.auth.DO_LOGIN_SUCCESS, payload: user });
          // Redirect
          yield call(NavigatorService.navigate, action.isFirstLogin ? 'SiteTutorial' : 'App');
        } else {
          yield put({
            type: t.auth.DO_LOGIN_FAILED,
            message: 'Please click the link sent to your Email address',
          });
          yield put({
            type: t.auth.DO_VERIFICATION_EMAIL,
            payload: { user },
            isFirstLogin: true,
          });
        }
      } else {
        yield put({ type: t.auth.DO_LOGIN_FAILED, message: 'Invalid login' });
      }
    } catch (error) {
      LOG.console(error);
      yield put({ type: t.auth.DO_LOGIN_FAILED });
    }
  });
};

const watchRegister = function* watchRegister() {
  yield takeEvery(t.auth.DO_REGISTER, function* register(action) {
    yield put({ type: t.auth.DO_REGISTER_STARTED });
    try {
      const data = yield call(api.doRegister, action.payload.email, action.payload.password);
      if (data) {
        yield put({ type: t.auth.DO_REGISTER_SUCCESS, payload: data });
        // Change the current auth view to the registration code verification.
        // yield put({ type: t.auth.SET_VISIBLE_FORM, payload: 'MFA' });
        yield put({
          type: t.auth.DO_VERIFICATION_EMAIL,
          payload: { user: data },
          isFirstLogin: true,
        });
      } else {
        yield put({ type: t.auth.DO_REGISTER_FAILED });
      }
    } catch (error) {
      yield put({ type: t.auth.DO_REGISTER_FAILED, payload: error });
    }
  });
};

const watchSendVerificationEmail = function* watchSendVerificationEmail() {
  yield takeEvery(t.auth.DO_VERIFICATION_EMAIL, function* verify(action) {
    yield put({ type: t.auth.DO_VERIFICATION_EMAIL_STARTED });
    try {
      yield call(api.doSendVerificationEmail, action.payload.user.user);
      yield put({ type: t.auth.DO_VERIFICATION_EMAIL_SUCCESS });
      // Redirect
      yield put({
        type: t.auth.SET_VISIBLE_FORM,
        payload: 'LOGIN',
        isFirstLogin: action.isFirstLogin,
      });
    } catch (error) {
      yield put({ type: t.auth.DO_VERIFICATION_EMAIL_FAILED, payload: error });
    }
  });
};

const watchSignout = function* watchSignout() {
  yield takeEvery(t.auth.DO_SIGNOUT, function* signOut() {
    yield put({ type: t.auth.DO_SIGNOUT_STARTED });
    try {
      yield call(api.doSignOut);
      yield put({ type: t.auth.DO_SIGNOUT_SUCCESS });
      // Redirect from signout component.
      // yield call(NavigatorService.reset, 'Auth');
      yield call(NavigatorService.navigate, 'Auth');
    } catch (error) {
      yield put({ type: t.auth.DO_SIGNOUT_FAILED, payload: error });
    }
  });
};

const watchResetPassword = function* watchResetPassword() {
  yield takeEvery(t.auth.DO_RESET_PASSWORD, function* resetPassword(action) {
    yield put({ type: t.auth.DO_RESET_PASSWORD_STARTED });
    try {
      yield call(api.doResetPassword, action.payload.email);
      yield put({ type: t.auth.DO_RESET_PASSWORD_SUCCESS });
      yield put({ type: t.auth.SET_VISIBLE_FORM, payload: 'LOGIN' });
    } catch (error) {
      yield put({ type: t.auth.DO_RESET_PASSWORD_FAILED, payload: error });
    }
  });
};

const setUsername = function* setUsername(action) {
  yield put({ type: t.auth.SET_USERNAME_STARTED, payload: action.payload });
};

const watchSetUsername = function* watchSetUsername() {
  yield takeEvery(t.auth.SET_USERNAME, setUsername);
};

const setPassword = function* setPassword(action) {
  yield put({ type: t.auth.SET_PASSWORD_STARTED, payload: action.payload });
};

const watchSetPassword = function* watchSetPassword() {
  yield takeEvery(t.auth.SET_PASSWORD, setPassword);
};

const watchSaveUser = function* watchSaveUser() {
  yield takeEvery(t.auth.SAVE_USER, function* saveUser(action) {
    yield put({ type: t.auth.SAVE_USER_STARTED });
    try {
      const { user } = action;
      const userDocRef = yield call(api.doSaveUser, user);
      user.key = userDocRef.id;
      user.doc = userDocRef.ref;
      user.debug = userDocRef.data().debug;
      yield put({
        type: t.auth.SAVE_USER_SUCCESS,
        user,
      });
    } catch (error) {
      yield put({ type: t.auth.SAVE_USER_FAILED, error });
    }
  });
};

export default [
  fork(watchSetPassword),
  fork(watchSetUsername),
  fork(watchLogin),
  fork(watchLoginProvider),
  fork(watchRegister),
  fork(watchSendVerificationEmail),
  fork(watchSignout),
  fork(watchResetPassword),
  fork(watchSaveUser),
];
