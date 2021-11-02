//
// File: reducers/authReducer.js
//
import LOG from '../utils/LOG';

//
// Action Types
//
export const authActions = {
  SAVE_USER: 'auth/SAVE_USER',
  SAVE_USER_STARTED: 'auth/SAVE_USER_STARTED',
  SAVE_USER_SUCCESS: 'auth/SAVE_USER_SUCCESS',
  SAVE_USER_FAILED: 'auth/SAVE_USER_FAILED',

  SET_USER: 'auth/SET_USER',

  SET_VISIBLE_FORM: 'auth/SET_VISIBLE_FORM',
  DO_LOGIN: 'auth/DO_LOGIN',
  DO_LOGIN_STARTED: 'auth/DO_LOGIN_STARTED',
  DO_LOGIN_SUCCESS: 'auth/DO_LOGIN_SUCCESS',
  DO_LOGIN_FAILED: 'auth/DO_LOGIN_FAILED',
  DO_REGISTER: 'auth/DO_REGISTER',
  DO_REGISTER_STARTED: 'auth/DO_REGISTER_STARTED',
  DO_REGISTER_SUCCESS: 'auth/DO_REGISTER_SUCCESS',
  DO_REGISTER_FAILED: 'auth/DO_REGISTER_FAILED',

  DO_LOGIN_PROVIDER: 'auth/DO_LOGIN_PROVIDER',

  DO_VERIFICATION_EMAIL: 'auth/DO_VERIFICATION_EMAIL',
  DO_VERIFICATION_EMAIL_STARTED: 'auth/DO_VERIFICATION_EMAIL_STARTED',
  DO_VERIFICATION_EMAIL_SUCCESS: 'auth/DO_VERIFICATION_EMAIL_SUCCESS',
  DO_VERIFICATION_EMAIL_FAILED: 'auth/DO_VERIFICATION_EMAIL_FAILED',

  DO_RESET_PASSWORD: 'auth/DO_RESET_PASSWORD',
  DO_RESET_PASSWORD_STARTED: 'auth/DO_RESET_PASSWORD_STARTED',
  DO_RESET_PASSWORD_SUCCESS: 'auth/DO_RESET_PASSWORD_SUCCESS',
  DO_RESET_PASSWORD_FAILED: 'auth/DO_RESET_PASSWORD_FAILED',

  SET_USERNAME: 'auth/SET_USERNAME',
  SET_USERNAME_STARTED: 'auth/SET_USERNAME_STARTED',
  SET_PASSWORD: 'auth/SET_PASSWORD',
  SET_PASSWORD_STARTED: 'auth/SET_PASSWORD_STARTED',
  LOGGED_IN: 'auth/LOGGED_IN',
  LOGGED_OUT: 'auth/LOGGED_OUT',

  DO_SIGNOUT: 'auth/DO_SIGNOUT',
  DO_SIGNOUT_STARTED: 'auth/DO_SIGNOUT_STARTED',
  DO_SIGNOUT_SUCCESS: 'auth/DO_SIGNOUT_SUCCESS',
  DO_SIGNOUT_FAILED: 'auth/DO_SIGNOUT_FAILED',

  FETCH_USERINFO: 'auth/FETCH_USERINFO',
  FETCH_USERINFO_STARTED: 'auth/FETCH_USERINFO_STARTED',
  FETCH_USERINFO_SUCCESS: 'auth/FETCH_USERINFO_SUCCESS',
  FETCH_USERINFO_FAILED: 'auth/FETCH_USERINFO_FAILED',
};

//
// Action Creators
// ...

//
// Selectors
// ...

//
// Reducers

const authReducer = (state = {}, action) => {
  // LOG.console(action.type);
  switch (action.type) {
    case authActions.SAVE_USER_STARTED: {
      return { ...state, isLoading: true };
    }
    case authActions.SAVE_USER_SUCCESS: {
      return { ...state, isLoading: false };
    }
    case authActions.SAVE_USER_FAILED: {
      LOG.console(action);
      return { ...state, isLoading: false };
    }
    case authActions.SET_USER: {
      return { ...state, user: action.user, userSet: action.userSet };
    }
    case authActions.SET_VISIBLE_FORM: {
      return { ...state, visibleForm: action.payload, isFirstLogin: action.isFirstLogin };
    }
    case authActions.SET_USERNAME_STARTED: {
      return { ...state, username: action.payload };
    }
    case authActions.SET_PASSWORD_STARTED: {
      return { ...state, password: action.payload };
    }
    case authActions.DO_LOGIN_STARTED: {
      return { ...state, loginStatus: 'ongoing', isLoading: true };
    }
    case authActions.DO_LOGIN_SUCCESS: {
      LOG.console(action);
      return {
        ...state,
        loginStatus: 'success',
        isLoading: false,
        user: action.payload,
        errorMessage: null,
      };
    }
    case authActions.DO_LOGIN_FAILED: {
      LOG.console(action);
      return {
        ...state,
        loginStatus: 'failed',
        isLoading: false,
        errorMessage: action.message || 'Unable to login',
      };
    }
    case authActions.DO_REGISTER_STARTED: {
      return {
        ...state,
        errorMessage: '',
        isLoading: true,
        registerStatus: 'ongoing',
      };
    }
    case authActions.DO_REGISTER_SUCCESS: {
      return {
        ...state,
        isLoading: false,
        errorMessage: '',
        registerStatus: 'success',
        user: action.payload,
      };
    }
    case authActions.DO_REGISTER_FAILED: {
      return {
        ...state,
        registerStatus: 'failed',
        isLoading: false,
        errorMessage: action.payload.message || 'Unable to register',
      };
    }
    case authActions.DO_VERIFICATION_EMAIL: {
      return { ...state, user: action.payload.user };
    }
    case authActions.DO_VERIFICATION_EMAIL_STARTED: {
      return { ...state, isLoading: true };
    }
    case authActions.DO_VERIFICATION_EMAIL_SUCCESS: {
      return {
        ...state,
        isLoading: false,
        errorMessage: 'We’ve sent you an email. Click on the link to complete your registration.',
      };
    }
    case authActions.DO_VERIFICATION_EMAIL_FAILED: {
      return { ...state, errorMessage: action.payload.message, isLoading: false };
    }
    case authActions.DO_SIGNOUT_STARTED: {
      return { ...state };
    }
    case authActions.DO_SIGNOUT_SUCCESS: {
      return { ...state, user: null };
    }
    case authActions.DO_SIGNOUT_FAILED: {
      return { ...state };
    }
    case authActions.DO_RESET_PASSWORD_STARTED: {
      return { ...state, isLoading: true };
    }
    case authActions.DO_RESET_PASSWORD_SUCCESS: {
      return {
        ...state,
        isLoading: false,
        errorMessage: 'Please check your Email for password reset instructions.',
      };
    }
    case authActions.DO_RESET_PASSWORD_FAILED: {
      return { ...state, isLoading: false, errorMessage: action.payload.message };
    }
    default:
      return state;
  }
};

export default authReducer;
