//
// File: sagas/phone.js
//
import DeviceInfo from "react-native-device-info";
import { put, takeEvery, call, fork } from "redux-saga/effects";
import { actionTypes as t } from "../reducers";
import firebase from "../config/firebase";
import { Platform } from "react-native";

const db = firebase.firestore();

export const getCurrentPhone = async () => {
  const phone = {
    brand: DeviceInfo.getBrand(),
    manufacturer: await DeviceInfo.getManufacturer(),
    model: DeviceInfo.getModel(),
    systemName: DeviceInfo.getSystemName(),
    systemVersion: DeviceInfo.getSystemVersion(),
    userAgent: await DeviceInfo.getUserAgent(),
    isTablet: DeviceInfo.isTablet(),
    luxmodifier: 1, // default
  };
  if (Platform.OS === "android") phone["APILevel"] = await DeviceInfo.getApiLevel()
  return phone;
};

const savePhone = (phone) => {
  const docRef = db.collection("phones");
  docRef.add(phone);
};

/**
 * A phone identifier is made up of systemName, brand, model, systemVersion.
 * @param {} phone Database returns best possible match for this phone.
 *
 */
const findPhone = async (phone) => {
  const docRef = db.collection("phones");

  // First retrieve phones that are the same as the systemName.
  // This should return at least one phone as there are defaults per systemName.
  const phoneCol = await docRef
    .where("systemName", "==", phone.systemName)
    .orderBy("model")
    .get();
  if (phoneCol.empty) throw new Error("No default phone set.");
  if (phoneCol.size === 1) {
    // Return the default phone early
    return phoneCol.docs[0].data();
  }

  const brands = phoneCol.docs.filter(
    (doc) => doc.data().brand === phone.brand
  );
  const models = brands.filter((doc) => doc.data().model === phone.model);
  const exact = models.filter(
    (doc) => doc.data().systemVersion === phone.systemVersion
  );

  if (exact.length) {
    // Set exactMatch key so we do not save it again.
    return { ...exact[0].data(), exactMatch: true };
  }
  if (models.length) {
    return models[0].data();
  }
  if (brands.length) {
    return brands[0].data();
  }

  // There should always be one
  const defaultPhone = phoneCol.docs.filter(
    (doc) => doc.data().brand === "DEFAULT"
  );
  return defaultPhone[0].data();
};

const watchGetPhone = function* watchGetPhone() {
  yield takeEvery(t.phone.GET_PHONE, function* getPhone(action) {
    try {
      yield put({ type: t.phone.GET_PHONE_STARTED });
      let phone = yield call(getCurrentPhone);
      const bestMatch = yield call(findPhone, phone);

      if (!bestMatch.exactMatch) {
        // This is a new phone so save it with determined luxmodifier setting.
        phone = { ...phone, luxmodifier: bestMatch.luxmodifier };
        yield call(savePhone, phone);
      } else {
        // Set the phone object to the one retrieved from the db.
        phone = bestMatch;
      }
      // Return the phone
      yield put({ type: t.phone.GET_PHONE_SUCCESS, phone });
    } catch (error) {
      yield put({ type: t.phone.GET_PHONE_FAILED, error });
    }
  });
};

export default [fork(watchGetPhone)];
