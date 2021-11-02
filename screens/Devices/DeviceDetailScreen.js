//
// File: screens/Devices/DeviceDetailScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import {
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import * as Yup from 'yup';
import axios from 'axios';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as WebBrowser from 'expo-web-browser'


import { TabView, TabBar } from 'react-native-tab-view';

import bleApi from '../../sagas/deviceBleApi';
import SectionHeader from '../../components/SectionHeader';
import SectionLoader from '../../components/SectionLoader';
import Settings from '../../components/Settings/Settings';
import MeshMessage from '../../components/MeshMessage';
import Constants from '../../utils/constants';
import string from '../../utils/string';
import LOG from '../../utils/LOG';
import { actionTypes } from '../../reducers';
import Calibrate from './Calibrate';
import appStyles from '../styles';

@connect(store => ({
  site: store.site.site,
  device: store.site.device,
  siteZones: store.site.zones,
  dateUpdated: store.site.deviceUpdated,
  deviceInfo: store.device.deviceInfo,
  communicating: store.device.communicating,
  deviceMessage: store.device.message,
  phone: store.phone.phone,
  user: store.auth.user,
}))
class DeviceDetailScreen extends React.Component {
  static title = 'Device Details';

  // static navigationOptions = ({ navigation }) => ({
  //   title: navigation.getParam('title'),
  // });

  constructor(props) {
    super(props);
    this.subscription = null;
    this.state = {
      loading: false,
      capturing: true, // luxi capturing on component load.
      index: 0,
      routes: [{ key: 'first', title: 'Calibrate' }, { key: 'second', title: 'Settings' }],
    };

    this.initialLayout = {
      height: 0,
      width: Dimensions.get('window').width,
    };
  }

  componentDidMount() {
    activateKeepAwake('deviceDetailScreen');
  }

  componentWillUnmount() {
    deactivateKeepAwake('deviceDetailScreen');
  }

  onSaveSettings = async (key, val) => {
    // Dispatch to firestore
    const { device, dispatch } = this.props;

    //
    // The firestore device collection listener defined in the datastore saga
    // will update the collection, however we still need to tell the store that
    // the current device has been updated.
    // Set in firestore -> get from firestore -> dispatch updated doc to store
    //
    await device.ref.set({ [key]: val }, { merge: true });
    const newDeviceDoc = await device.ref.get();
    dispatch({ type: actionTypes.site.SET_DEVICE, device: newDeviceDoc });

    // Dispatch to BLE device only store.
    if (key === 'zoneid') {
      const zone = this.props.siteZones.find(z => z.key === val);
      if (zone && zone.meshId) {
        dispatch({
          type: actionTypes.device.SET_VALUE,
          serial: newDeviceDoc.data().serial,
          key: 'zoneMeshId',
          val: zone,
        });
      }
    } else {
      dispatch({
        type: actionTypes.device.SET_VALUE,
        serial: newDeviceDoc.data().serial,
        key,
        val,
      });
    }
  };

  //
  // Required for settingsHOC
  //
  settingsSchema = () => {
    const {
      device, siteZones, deviceInfo, navigation, site,
    } = this.props;
    const data = device.name ? device : device.data();
    const deviceZone = data.zoneid ? siteZones.find(z => z.key === data.zoneid) : null;
    const deviceZoneLabel = deviceZone ? deviceZone.name : 'Select Zone';

    const config = {
      title: 'Device Settings',
      listKey: device.id,
      fields: [
        {
          type: 'text',
          key: 'name',
          label: 'Name',
          placeholder: 'Enter name...',
          keyboardType: 'default',
          value: data.name,
          onSave: this.onSaveSettings,
          schema: Yup.object().shape({
            name: Yup.string()
              .required('Name is required!')
              .matches(Constants.REGEX_ALPHA, {
                message: Constants.REGEX_ALPHA_MSG,
                excludeEmptyString: true,
              })
              .min(3, 'Minimum of 3 characters')
              .max(20, 'Maximum of 20 characters'),
          }),
        },
        {
          type: 'select',
          key: 'zoneid',
          label: 'Zone',
          value: data.zoneid,
          valueLabel: deviceZoneLabel,
          placeholder: 'Select a zone...',
          options: siteZones.map(z => ({ label: z.name, value: z.key })),
          onSave: this.onSaveSettings,
        },
        {
          type: 'spacer',
        },
        {
          type: 'function',
          label: 'Energy Savings Report',
          onClick: async () => {
            try {
              const maxPowerX100 = await bleApi.getLampMaxPower(data.serial);
              const logData = await bleApi.getEnergyLogs(data.serial);
              // Forward energy saving data to getEnergySavingReport firebase function.
              const res = await axios.post(`${Constants.REPORT_URL}doEnergySavingReport`, {
              // const res = await axios.post(`${Constants.DEV_REPORT_URL}doEnergySavingReport`, {
                siteid: site.id,
                data: logData,
                max: maxPowerX100 / 100,
                name: data.name,
              });
              await WebBrowser.openBrowserAsync(res.data.publicurl);
            } catch (err) {
              LOG.console(err);
            }
          },
        },
        {
          type: 'spacer',
        },
        {
          type: 'label',
          label: 'Bluetooth ID',
          value: data.id,
        },
      ],
    };

    if (!deviceInfo) {
      config.fields.push({
        type: 'label',
        label: 'Loading light information...',
        value: '',
      });
    }

    if (deviceInfo) {
      config.fields.push(
        {
          type: 'label',
          label: 'Serial Number',
          // value: string.asHex(deviceInfo.serial_number),
          value: deviceInfo.serial_number,
        },
        {
          type: 'label',
          label: 'Zone Mesh ID',
          value: string.asHex(deviceInfo.zone),
        },
        {
          type: 'label',
          label: 'Site Mesh ID',
          value: string.asHex(deviceInfo.site_id),
        },
        {
          type: 'label',
          label: 'Calibrated?',
          value: string.YesNo(deviceInfo.calibrated),
        },
        {
          type: 'label',
          label: 'Has Errors?',
          value: string.YesNo(deviceInfo.any_errors),
        },
        {
          type: 'label',
          label: 'Firmware Version',
          value: String(deviceInfo.firmware_version),
        },
        {
          type: 'label',
          label: 'Hardware Version',
          value: String(deviceInfo.hardware_version),
        },
      );
    }

    if (this.props.user.debug) {
      config.fields.push(
        {
          type: 'spacer',
        },
        {
          type: 'function',
          label: 'Diagnostics',
          onClick: () => {
            navigation.navigate('Diagnostics');
          },
        },
      );
    }

    return config;
  };

  handleIndexChange = (index) => {
    let { capturing } = this.state;

    if (index === 1 && capturing) {
      capturing = false;
    } else if (index === 0 && !capturing) {
      capturing = true;
    }

    // capturing is used to tell the Capturing component
    // when it should start or stop the lux detector.
    this.setState({ index, capturing });
  };

  renderHeader = props => (
    <TabBar
      {...props}
      indicatorStyle={appStyles.indicator}
      style={appStyles.tabbar}
      tabStyle={appStyles.tab}
      labelStyle={appStyles.label}
      // scrollEnabled
    />
  );

  renderScene = (route, navigationState) => {
    const schema = this.settingsSchema();
    const { device, phone, capturing } = navigationState;

    const scenes = {
      first: (
        <Calibrate
          capturing={capturing}
          device={device}
          phone={phone}
          onComplete={() => this.onSaveSettings('calibrated', true)}
        />
      ),
      second: (
        <ScrollView>
          <Settings config={schema} onClose={() => null} modal={false} isInline />
        </ScrollView>
      ),
    };

    return scenes[route.route.key];
  };

  render() {
    const { siteZones } = this.props;
    const { loading } = this.state;
    let { device } = this.props;
    
    // If there is a data function then the device is saved to the site and
    // we are dealing with a firestore object.
    if (device.data) {
      device = device.data();
    }
    const calibratedStatus = device.calibrated ? 'Calibrated' : 'Not Calibrated';
    const deviceZone = device.zoneid ? siteZones.find(z => z.key === device.zoneid) : null;
    let displayName = device.name;
    if (deviceZone) {
      displayName = `${deviceZone.name} ${device.name}`;
    }

    const tabState = {
      ...this.state,
      ...this.props,
      device,
    };

    if (loading) {
      return <SectionLoader title={`Loading ${displayName}...`} />;
    }

    return (
      <SafeAreaView style={appStyles.container}>
        <SectionHeader
          title={displayName}
          subTitle={calibratedStatus}
          zones={null}
          switches={device.switch ? 1 : 0}
          devices={null}
        />
        <TabView
          navigationState={tabState}
          renderScene={(props) => this.renderScene(props, tabState)}
          renderTabBar={this.renderHeader}
          onIndexChange={this.handleIndexChange}
          initialLayout={this.initialLayout}
        />
        <MeshMessage
          visible={this.props.communicating || this.props.deviceMessage}
          msg={this.props.deviceMessage}
        />
      </SafeAreaView>
    );
  }
}

export default DeviceDetailScreen;
