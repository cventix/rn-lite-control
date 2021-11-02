//
// File: reducers/siteReducer.js
//
import firstBy from 'thenby';
import date from '../utils/datetime';

//
// Action Types
//
const p = 'site/';
export const siteActions = {
  FETCH_SITE: `${p}FETCH_SITE`,
  FETCH_SITE_STARTED: `${p}FETCH_SITES_STARTED`,
  FETCH_SITE_SUCCESS: `${p}FETCH_SITES_SUCCESS`,
  FETCH_SITE_FAILED: `${p}FETCH_SITES_FAILED`,
  FETCH_USER_SITES: `${p}FETCH_USER_SITES`,
  FETCH_USER_SITES_STARTED: `${p}FETCH_USER_SITES_STARTED`,
  FETCH_USER_SITES_SUCCESS: `${p}FETCH_USER_SITES_SUCCESS`,
  FETCH_USER_SITES_FAILED: `${p}FETCH_USER_SITES_FAILED`,
  FETCH_SITES_FOR_DEVICES: `${p}FETCH_SITES_FOR_DEVICES`,
  SET_ZONE: `${p}SET_ZONE`,
  SET_DEVICE: `${p}SET_DEVICE`,
  SET_SITE: `${p}SET_SITE`,
  DEVICES_UPDATED: `${p}DEVICES_UPDATED`,
  ZONES_UPDATED: `${p}ZONES_UPDATED`,
  SWITCHES_UPDATED: `${p}SWITCHES_UPDATED`,
  SAVE_DEVICE: `${p}SAVE_DEVICE`,
  SAVE_DEVICE_STARTED: `${p}SAVE_DEVICE_STARTED`,
  SAVE_DEVICE_SUCCESS: `${p}SAVE_DEVICE_SUCCESS`,
  SAVE_DEVICE_FAILED: `${p}SAVE_DEVICE_FAILED`,
};

//
// Action Creators
// ...

//
// Selectors
// ...

//
// Reducers

const sortByName = (a, b) => {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

const sortByNameDesc = (a, b) => {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  if (nameA > nameB) return -1;
  if (nameA < nameB) return 1;
  return 0;
};

const sortNumDesc = (a, b) => {
  if (a > b) return -1;
  if (a < b) return 1;
  return 0;
};

const sortLightNameDesc = (a, b) => {
  if (a.name.indexOf('L:') !== -1 && b.name.indexOf('L:') !== -1) {
    const numA = Number(a.name.split(':')[1]);
    const numB = Number(b.name.split(':')[1]);
    return sortNumDesc(numA, numB);
  }
  // If there is no light number prefix, then push to bottom of list sorted in ascending order.
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

const sortByCalibrated = (a, b) => {
  const calibA = a.lastcalibrated;
  const calibB = b.lastcalibrated;

  if (!calibA && calibB) {
    return -1;
  }
  if (!calibB && calibA) {
    return 1;
  }
  return 0;
};

const siteReducer = (
  state = {
    sites: [],
    fetchingSite: false,
    site: null,
    devices: [],
    zones: [],
  },
  action,
) => {
  switch (action.type) {
    case siteActions.FETCH_SITE_STARTED:
      return {
        ...state,
        fetchingSite: true,
        site: null,
        error: null,
        devices: [],
        zones: [],
      };
    case siteActions.FETCH_SITE_SUCCESS:
      return {
        ...state,
        fetchingSite: false,
        site: action.site,
        error: null,
      };
    case siteActions.FETCH_SITE_FAILED:
      return {
        ...state,
        fetchingSite: false,
        error: action.error,
        site: null,
        devices: [],
        zones: [],
      };
    case siteActions.FETCH_USER_SITES_STARTED:
      return {
        ...state,
        fetchingSite: true,
        userSites: null,
        error: null,
      };
    case siteActions.FETCH_USER_SITES_SUCCESS:
      return {
        ...state,
        fetchingSite: false,
        error: null,
        userSites: action.userSites.docs
          .map(s => ({
            key: s.id,
            doc: s,
            ...s.data(),
            creationTime: date.datetime(s.data().creationTime),
          }))
          .sort(sortByName),
      };
    case siteActions.FETCH_USER_SITES_FAILED:
      return {
        ...state,
        fetchingSite: false,
        error: action.error,
        userSites: null,
      };
    case siteActions.SET_ZONE:
      return { ...state, zone: action.zone };
    case siteActions.SET_DEVICE:
      return { ...state, device: action.device };
    case siteActions.SET_SITE:
      return { ...state, site: action.site };
    case siteActions.DEVICES_UPDATED: {
      // Sort by calibrated status, then by descending name.
      const siteDevices = action.payload.slice();
      const devices = siteDevices.sort(firstBy(sortByCalibrated).thenBy(sortLightNameDesc));
      return { ...state, devices };
    }
    case siteActions.ZONES_UPDATED: {
      const zones = action.payload.slice().sort(sortByName);
      return { ...state, zones };
    }
    case siteActions.SWITCHES_UPDATED: {
      const switches = action.payload.slice().sort(sortByName);
      return { ...state, switches };
    }
    case siteActions.SAVE_DEVICE_STARTED:
      return { ...state, saving: true };
    case siteActions.SAVE_DEVICE_SUCCESS:
      return { ...state, saving: false, device: action.device };
    case siteActions.SAVE_DEVICE_FAILED:
      return { ...state, saving: false, error: action.error };
    default:
      // console.log('UNKNONW DISPATCH TYPE:', action.type);
      return state;
  }
};

export default siteReducer;
