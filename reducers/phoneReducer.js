//
// File: reducers/phoneReducer.js
//

import LOG from '../utils/LOG';

//
// Action Types
//
const p = 'phone/';
export const Actions = {
  GET_PHONE: `${p}GET_PHONE`,
  GET_PHONE_STARTED: `${p}GET_PHONE_STARTED`,
  GET_PHONE_SUCCESS: `${p}GET_PHONE_SUCCESS`,
  GET_PHONE_FAILED: `${p}GET_PHONE_FAILED`,
};

//
// Action Creators
// ...

//
// Selectors
//
const getError = (error) => {
  let err = error;
  if (err && err.message) {
    err = err.message.replace(/Error:\s?/gi, '');
  }
  return err;
};

//
// Reducers

const phoneReducer = (
  state = {
    phone: null,
    loading: false,
    error: null,
  },
  action,
) => {
  switch (action.type) {
    case Actions.GET_PHONE_STARTED: {
      return { ...state, loading: true };
    }
    case Actions.GET_PHONE_SUCCESS: {
      return {
        ...state,
        loading: false,
        phone: action.phone,
        error: null,
      };
    }
    case Actions.GET_PHONE_FAILED: {
      LOG.console(action);
      return { ...state, loading: false, error: getError(action.error) };
    }
    default:
      // console.log('UNKNOWN DISPATCH TYPE:', action.type);
      return state;
  }
};

export default phoneReducer;
