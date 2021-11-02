import { put, takeEvery, take, call, fork } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

import * as api from './datastoreApi';
import { actionTypes as t } from '../reducers';
import LOG from '../utils/LOG';

const siteUnsubscribes = [];

const createCollectionEventChannel = (ref) => {
  const listener = eventChannel((emit) => {
    const unsubscribe = ref.onSnapshot((querySnapShot) => {
      const col = [];
      querySnapShot.forEach((doc) => {
        col.push({
          key: doc.id,
          doc, // DocumentSnapshot
          ...doc.data(),
        });
      });
      // emit the populated array so it is returned to the yield take in watchCollectionUpdate
      emit(col);
    });

    // Save the unsubscribe for later so it can be called when a new site is selected.
    siteUnsubscribes.push(unsubscribe);
    return unsubscribe;
  });

  return listener;
};

const watchCollectionUpdate = function* watchDeviceUpdate(actionType, ref) {
  const updateChannel = createCollectionEventChannel(ref);
  while (true) {
    const payload = yield take(updateChannel);
    yield put({ type: actionType, payload });
  }
};

/**
 * Get a snapshot of the site document, then setup listener subscriptions
 * to the devices, zones, and switches collections within the site document.
 * These collections are stored in the redux store, and will auto-update
 * when there is a new document added.
 * @param  {} action
 * @example this.props.dispatch({type: actionTypes.site.FETCH_SITE, siteid: id})
 */
const fetchSite = function* fetchSite(action) {
  try {
    yield put({ type: t.site.FETCH_SITE_STARTED });

    // If there are any previous site collection subscriptions
    // then unsubscribe them here and clear the subscription array.
    siteUnsubscribes.forEach((unsubscribe) => {
      unsubscribe();
      // LOG.console('Unsubscribing');
    });
    siteUnsubscribes.splice(0);

    const site = yield call(api.getSite, action.siteid);

    if (site.exists) {
      const devicesRef = yield call(api.getDevices, site.ref);
      const zonesRef = yield call(api.getZones, site.ref);
      // const switchesRef = yield call(api.getSwitches, site.ref);

      //
      // Fork new watcher generator functions for each collection.
      // The watchers use redux-saga's eventChannel to subscribe to the collection's
      // onSnapshot event.
      // This allows us to have each of the high level collections for a
      // site be automatically updated throughout the app.
      //
      yield fork(watchCollectionUpdate, t.site.DEVICES_UPDATED, devicesRef);
      yield fork(watchCollectionUpdate, t.site.ZONES_UPDATED, zonesRef);
      // yield fork(watchCollectionUpdate, t.site.SWITCHES_UPDATED, switchesRef);

      yield put({
        type: t.site.FETCH_SITE_SUCCESS,
        site,
      });
    } else {
      throw Error(`Site ${action.siteid} does not exist`);
    }
  } catch (error) {
    yield put({ type: t.site.FETCH_SITE_FAILED, error });
  }
};

const fetchUserSites = function* fetchUserSites(action) {
  try {
    yield put({ type: t.site.FETCH_USER_SITES_STARTED });
    const userSites = yield call(api.getUserSites, action.userRef);
    if (userSites) {
      yield put({ type: t.site.FETCH_USER_SITES_SUCCESS, userSites });
    } else {
      throw new Error('You do not have any existing sites');
    }
  } catch (error) {
    LOG.console(error);
    yield put({ type: t.site.FETCH_USER_SITES_FAILED, error });
  }
};

const saveDevice = function* saveDevice(action) {
  try {
    yield put({ type: t.site.SAVE_DEVICE_STARTED });
    const data = yield call(api.saveDevice, action.siteid, action.deviceid, action.fields);
    if (data) {
      // LOG.console('saving', data);
      yield put({ type: t.site.SAVE_DEVICE_SUCCESS, device: data });
    } else {
      throw Error('Could not retrieve device');
    }
  } catch (error) {
    yield put({ type: t.site.SAVE_DEVICE_FAILED, error });
  }
};

const fetchSitesForDevices = function* fetchSitesForDevices(action) {
  try {
    // yield put({ type: t.site.FETCH_USER_SITES_STARTED });
    const { devices } = action;
    const devicesWithSites = yield call(api.getSitesForDevices, devices);
    yield put({ type: t.device.UPDATED, devices: devicesWithSites });

    // const userSites = yield call(api.getUserSites, action.userRef);
    // yield put({ type: t.site.FETCH_USER_SITES_SUCCESS, userSites });
  } catch (error) {
    LOG.console(error);
    // yield put({ type: t.site.FETCH_USER_SITES_FAILED, error });
  }
};

const watchFetchSitesForDevices = function* watchFetchSitesForDevices() {
  yield takeEvery(t.site.FETCH_SITES_FOR_DEVICES, fetchSitesForDevices);
};

const watchFetchSite = function* watchFetchSite() {
  yield takeEvery(t.site.FETCH_SITE, fetchSite);
};

const watchSaveDevice = function* watchSaveDevice() {
  yield takeEvery(t.site.SAVE_DEVICE, saveDevice);
};

const watchFetchUserSites = function* watchFetchUserSites() {
  yield takeEvery(t.site.FETCH_USER_SITES, fetchUserSites);
};

export default [
  fork(watchFetchSite),
  fork(watchSaveDevice),
  fork(watchFetchUserSites),
  fork(watchFetchSitesForDevices),
];
