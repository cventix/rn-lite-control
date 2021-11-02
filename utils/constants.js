//
// File: utils/constants.js
//
import { Platform, Dimensions } from 'react-native';
import packageJson from '../package.json';

const { width, height } = Dimensions.get('window');

export default {
  APP_NAME: 'Litesense',
  VERSION: packageJson.version,
  REPORT_URL: 'https://us-central1-luxsmartcontroller-196104.cloudfunctions.net/',
  DEV_REPORT_URL: 'http://192.168.0.7:5000/luxsmartcontroller-196104/us-central1/',
  REGEX_ALPHA: /^[\w\s-:\/\\]+$/,
  REGEX_ALPHA_MSG: 'Alphanumeric, :, /, \\, - and _ only',
  WIDTH: width,
  HEIGHT: height,
  IS_IPHONEX:
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (height === 812 || width === 812) || (height === 896 || width === 896) || (height === 844 || width === 844),
  ICON: {
    device: 'lightbulb-outline',
    zone: 'group-work',
    // zone: 'blur-circular',
    // zone: 'device-hub',
    // zone: 'blur-on',
    switch: 'grid-on',
    settings: 'settings',
    site: 'home',
    tutorial: 'library-books',
    help: 'help-outline',
    account: 'person',
    subSettings: 'more-vert',
    drawer: 'menu',
    signal: 'wifi',
    // signal: 'settings-input-antenna',
  },
  DEVICE: {
    SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // This is the actual service id for write / notify characteristics.
    SERVICEFILTER: '1828', // This is the service id that is advertised.
    WRITECHARACTERISTIC: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    NOTIFICATIONCHARACTERISTIC: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
    NAMEFILTER: '0x', // Very general name filter for serial numbers in the name.
    FROM: 0x0,
    DEFAULT_PIN: 0x0000,
    DEFAULT_NAME: 'LuxSmart',
  },
};
