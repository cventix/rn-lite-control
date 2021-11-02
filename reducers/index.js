//
// File: reducers/index.js
//
import { combineReducers } from 'redux';
import site, { siteActions } from './siteReducer';
import auth, { authActions } from './authReducer';
import device, { Actions as deviceActions } from './deviceReducer';
import phone, { Actions as phoneActions } from './phoneReducer';

//
// Action Types
//
export const actionTypes = {
  auth: authActions,
  site: siteActions,
  device: deviceActions,
  phone: phoneActions,
};

//
// Action Creators
// ...

//
// Selectors
// ...

//
// Reducers

export default combineReducers({
  auth,
  site,
  phone,
  device,
});
