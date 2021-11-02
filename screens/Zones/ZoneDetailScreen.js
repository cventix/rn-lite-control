//
// File: screens/Zones/ZoneDetailScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import { SafeAreaView, View, Dimensions, ScrollView } from 'react-native';
import {
  withTheme,
  Divider,
  Subheading,
  Dialog,
  // DialogTitle,
  // DialogContent,
  Paragraph,
  // DialogActions,
  DialogScrollArea,
  Portal,
  Button,
} from 'react-native-paper';
import { TabView, TabBar } from 'react-native-tab-view';
import { Messages } from 'luxsmart-comms';
import Modal from 'react-native-modal';

import SectionHeader from '../../components/SectionHeader';
import SectionLoader from '../../components/SectionLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import SlideMe from '../../components/SlideMe';
import AccordianCard from '../../components/AccordianCard';
import Settings from '../../components/Settings/Settings';
import MeshMessage from '../../components/MeshMessage';
import SettingSwitch from '../../components/Settings/SettingSwitch';

import ZoneSettingsSchema from './ZoneSettingsSchema';
import ZoneDeviceList from './ZoneDeviceList';
import DiscoveredDevices from './DiscoveredDevices';
import Calibrate from '../Devices/Calibrate';

import { actionTypes } from '../../reducers';
import appStyles from '../styles';

import siteApi from '../../sagas/datastoreApi';
import api from '../../sagas/deviceBleApi';
import LOG from '../../utils/LOG';
import Constants from '../../utils/constants';
import device from '../../sagas/device';

@connect((store) => ({
  site: store.site.site,
  zone: store.site.zone,
  siteDevices: store.site.devices,
  devices: store.device.devices,
  deviceSettings: store.device.deviceSettings,
  discovering: store.device.discovering,
  communicating: store.device.communicating,
  deviceMessage: store.device.message,
  phone: store.phone.phone,
}))
class ZoneDetailScreen extends React.Component {
  static title = 'Zone Details';

  constructor(props) {
    super(props);

    this.state = {
      devices: [],
      warningMsg: null,
      loading: false,
      showDelete: false,
      isDeleting: false,
      devicePressed: false,
      showRemoveFromZone: false,
      isRemovingFromZone: false,
      deviceToRemove: null,
      hasDiscovered: false,
      deviceToCalibrate: null,
      calibrationComplete: false,
      index: -1, // The tab index
      routes: [
        { key: 'first', title: 'Zoned Lights' },
        { key: 'second', title: 'Available Lights' },
        { key: 'third', title: 'Settings' },
      ],
    };

    this.settingsKeys = [
      'lux_active',
      'power_saving',
      'power_PIR_expired',
      'time_saving',
      'time_PIR_expired',
      'zone_PIR_enabled',
    ];

    this.initialLayout = {
      height: 0,
      width: Dimensions.get('window').width,
    };
  }

  // Stop updating zone settings based on device settings for now.
  // componentDidUpdate(prevProps) {
  //   // The device settings are the source of truth so match
  //   // the zone settings with it if they differ.
  //   if (!(this.props.deviceSettings && this.props.zone)) {
  //     return;
  //   }

  //   // Make sure to only update the zone settings from a device
  //   // if there are actual devices saved in this zone.
  //   if (!siteApi.getDevicesInZone(this.props.siteDevices, this.props.devices, this.props.zone).length) {
  //     return;
  //   }

  //   const keys = this.settingsKeys;
  //   const isPropsDifferent = keys.some((k) => {
  //     if (!prevProps.deviceSettings) return true;
  //     return this.props.deviceSettings[k] !== prevProps.deviceSettings[k];
  //   });

  //   if (isPropsDifferent) {
  //     const dSet = this.props.deviceSettings;
  //     const zSet = this.props.zone.data();
  //     const update = keys.filter(k => dSet[k] !== zSet[k]);

  //     if (update.length) {
  //       // There are differences between the key settings so
  //       // update the zone settings to match the device's settings.
  //       const settingsCol = update.map(k => ({ [k]: dSet[k] }));
  //       // Convert settingsCol array to key:val obj
  //       const settings = Object.assign({}, ...settingsCol);

  //       LOG.console('Updating zone settings to match device settings', settings);
  //       this.saveSettingsObj(settings);
  //     }
  //   }
  // }

  async componentDidUpdate(prevProps) {
    if (!this.props.devices || !prevProps) return;

    if (prevProps.devices && this.props.devices.length === prevProps.devices.length) {
      // No new device so exit.
      return;
    }

    // If the device has site information then do not include it. We only want
    // unprovisioned devices here.
    let devices = await Promise.all(
      this.props.devices.map(async (newDevice) => {
        try {
          const deviceSite = await siteApi.getDeviceSite(newDevice.serial);
          if (!deviceSite) {
            return newDevice;
          }
        } catch (err) {
          LOG.console(err);
        }
        return null;
      })
    );

    devices = devices.filter((d) => d !== null);

    if (devices.length !== this.state.devices.length) {
      this.setState({ devices });
    }
  }

  onDetectDevice = () => {
    // Load the store.device.devices with already connected devices.
    this.props.dispatch({ type: actionTypes.device.BLE_GET_CONNECTED });
    // Load the store.device.devices with advertising BLE devices.
    this.props.dispatch({
      type: actionTypes.device.DISCOVER,
      requireSiteID: false,
    });
    this.setState({ hasDiscovered: true });
  };

  onProvisionDevice = async (item) => {
    const { siteDevices, site, zone } = this.props;
    const { devices } = this.state;

    // Only allow dimmable lights in a zone with dimmable lights,
    // and non-dimmable lights in a zone with non-dimmable lights.
    const zoneDevices = siteApi.getDevicesInZone(siteDevices, devices, zone);
    try {
      // Send the default PIN if required.
      let isAuthenticated = await api.isAuthenticated(item.serial, item);
      if (!isAuthenticated) {
        isAuthenticated = await api.authenticate(item.serial, item, Constants.DEVICE.DEFAULT_PIN);
      }
      if (!isAuthenticated) {
        // Error
        this.setState({
          warningMsg: 'There was a problem authenticating the light. Please try again.',
        });
        return;
      }

      if (zoneDevices && zoneDevices.length) {
        const packetDiagExisting = await api.getDiagnostics(zoneDevices[0].serial);
        const packetDiagNew = await api.getDiagnostics(item.serial, item);

        if (!packetDiagExisting.isOK || !packetDiagNew.isOK) {
          // Error
          this.setState({
            warningMsg: 'There was a problem connecting to the light. Please try again.',
          });
          return;
        }
        if (packetDiagExisting.data.dim_detected_ok !== packetDiagNew.data.dim_detected_ok) {
          // Dim is different so do not allow in this zone.
          if (packetDiagNew.data.dim_detected_ok) {
            this.setState({
              warningMsg:
                'This light is dimmable, however you are adding it to a zone with non-dimmable lights. Please add this light to a zone with other dimmable lights.',
            });
          } else {
            this.setState({
              warningMsg:
                'This light is not dimmable, however you are adding it to a zone with dimmable lights. Please add this light to a zone with other non-dimmable lights.',
            });
          }
          return;
        }
      }
    } catch (err) {
      // This usually just means the device that we tried to connect to in the zone
      // to get the diagnostics could not be reached. Maybe it is turned off, etc.
      // Do not stop the commissioning process because of this.
      LOG.console(err);
    }

    try {
      // device info is used to check if this device has been calibrated before.
      const deviceInfoPacket = await api.getInfo(item.serial, item);

      // Setup the device onject, but don't save it yet.
      const device = siteApi.provisionDevice(
        item,
        site,
        zoneDevices,
        zone,
        this.settingsKeys,
        deviceInfoPacket.data
      );

      this.setState({ deviceToCalibrate: device, calibrationComplete: false });
    } catch (err) {
      LOG.console(err);
      this.setState({
        warningMsg: 'There was a problem adding the light. Please try again.',
      });
    }
  };

  onSaveLuxTarget = async (luxtarget) => {
    // const key = 'luxtarget';
    const settings = {
      lux_active: luxtarget,
    };
    await this.saveZoneAndDeviceSettings(settings);
  };

  onSaveStandbyPercent = async (value) => {
    // const key = 'standbyPercent';
    const power_saving = value;
    const settings = {
      power_saving,
    };
    await this.saveZoneAndDeviceSettings(settings);
  };

  onSavePirDelay = async (value) => {
    // const key = 'pirDelay';
    const settings = {
      time_PIR_expired: value * 60, // Seconds but UI is minutes
    };
    await this.saveZoneAndDeviceSettings(settings);
  };

  onSaveZonePirEnabled = async (value) => {
    const settings = {
      zone_PIR_enabled: value ? 1 : 0,
    };
    await this.saveZoneAndDeviceSettings(settings);
  };

  onSaveSettings = async (key, val) => {
    await this.saveSettingsObj({ [key]: val });
  };

  onZoneDevicePress = async (item) => {
    // LOG.console('Device pressed', item);
    // Set the current device to the firebase device doc reference.
    this.props.dispatch({
      type: actionTypes.site.SET_DEVICE,
      device: item.doc,
    });
    // this.props.dispatch({
    //   type: actionTypes.device.GET_DATA,
    //   to: item.serial,
    //   message: Messages.token.GET_INFO,
    // });
    try {
      await api.getInfo(item.serial);
      this.props.dispatch({
        type: actionTypes.device.GET_DATA,
        to: item.serial,
        message: Messages.token.GET_NETWORK_SETTINGS,
      });
      this.props.navigation.navigate('DeviceDetail');
    } catch (err) {
      LOG.console('Error retrieving device info', err);
      this.setState({
        warningMsg: 'Could not connect to the light. Please try again.',
      });
    }
  };

  onDeviceFlash = (item, connectToDevice = false, isUncommissioned = false) => {
    const { dispatch } = this.props;
    dispatch({
      type: actionTypes.device.FLASH,
      device: item,
      connectToDevice,
      isUncommissioned,
    });
  };

  onDeleteZone = () => {
    if (!this.state.isDeleting) this.setState({ showDelete: !this.state.showDelete });
  };
  onDeleteZoneConfirm = async (zone) => {
    const { navigation, devices: availableDevices } = this.props;
    this.setState({ isDeleting: true });

    try {
      // Delete devices from server collection
      const devices = siteApi.getDevicesInZone(this.props.siteDevices, this.state.devices, zone);

      // available devices ==> I'm not sure it is correct or not.
      // const devices = siteDevices.filter(sd => availableDevices.find(ad => ad.serial === sd.serial));

      // if (devices.length) {
      //   this.setState({
      //     warningMsg: 'Zone cannot be removed until all devices have been removed from it.',
      //     showDelete: false,
      //     isDeleting: false,
      //   });
      //   return;
      // }

      // #Commented due to prevent the remove zone if has any devices.length

      if (devices.length) {
        // Send out remove commands to zone id.
        // await api.removeFromMesh(zone.data().meshId);

        // devices.forEach((d) => siteApi.deleteDevice(d));

        await Promise.all(devices.map(async d => {
          await api.removeFromMesh(d.serial);
          await siteApi.deleteDevice(d);
        }));
      }

      // Delete zone document from server
      await zone.ref.delete();

      this.setState({ isDeleting: false });
      this.onDeleteZone();

      // Go back to the zone manage screen.
      navigation.goBack();
    } catch (err) {
      LOG.console(err);
      this.setState({
        warningMsg: 'There was a problem removing the zone. Please try again.',
        showDelete: false,
        isDeleting: false,
      });
    }
  };

  //
  // When a device is removed from a zone it it decommissioned from the site.
  // The only way to add the device again is to follow the new device setup steps.
  //
  onRemoveFromZone = (item) => {
    if (!this.state.isRemovingFromZone)
      this.setState({
        showRemoveFromZone: !this.state.showRemoveFromZone,
        deviceToRemove: item,
      });
  };
  onRemoveFromZoneConfirm = async (item) => {
    this.setState({ isRemovingFromZone: true });

    try {
      await api.removeFromMesh(item.serial);
      await siteApi.deleteDevice(item);
      this.setState({
        isRemovingFromZone: false,
        showRemoveFromZone: false,
        deviceToRemove: null,
      });
    } catch (err) {
      LOG.console(err);
      this.setState({
        showRemoveFromZone: false,
        isRemovingFromZone: false,
        warningMsg: 'There was a problem removing the light. Please try again.',
      });
    }
  };

  onDisconnect = async (item) => {
    await this.props.dispatch({ type: actionTypes.device.DISCONNECT, device: item });
  };

  onCloseWarning = () => {
    this.setState({ warningMsg: null });
  };

  onCancelCalibrate = () => {
    this.setState({ deviceToCalibrate: null });
  };

  onCalibrateComplete = (device) => {
    // Calibration Complete.
    this.setState({ calibrationComplete: true });
  };

  //
  // Required for settingsHOC
  //
  settingsSchema = () =>
    ZoneSettingsSchema(this.props.zone, this.onSaveSettings, this.onDeleteZone);

  getUnzonedDevices = () => this.props.siteDevices.filter((d) => !d.doc.data().zoneid);

  saveProvisionedDevice = async (device) => {
    const { dispatch, site, zone } = this.props;
    const { calibrationComplete } = this.state;

    try {
      // Provision the device to the mesh network.
      // dispatch({ type: actionTypes.device.ADD_TO_MESH, device });
      // Do not use a dispatched action as we need more control here if things go badly.
      await api.addToMesh(device, zone.data(), site.data(), device);

      // Save the provisioned device to the database.
      await siteApi.saveProvisionedDevice(
        { ...device, calibrated: device.calibrated || calibrationComplete },
        site
      );

      // Remove the item from the discovered store items.
      dispatch({ type: actionTypes.device.REMOVE_FROM_STORE, serial: device.serial });
    } catch (err) {
      LOG.console(err);
      this.setState({
        warningMsg: 'There was a problem adding the light. Please try again.',
      });
    }
  };

  /**
   * Saves settings to the server zone database and the ble device.
   *
   * @param  {} settings
   */
  saveZoneAndDeviceSettings = async (settings) => {
    const { dispatch, zone } = this.props;

    try {
      // Save to server..
      const newSettings = { ...zone.data(), ...settings };
      newSettings.power_PIR_expired = newSettings.power_saving;
      newSettings.time_saving = newSettings.time_PIR_expired;
      const zoneDevices = siteApi.getDevicesInZone(
        this.props.siteDevices,
        this.state.devices,
        this.props.zone
      );

      if (zoneDevices.length) {
        const allSettings = {};
        this.settingsKeys.forEach((k) => (allSettings[k] = newSettings[k]));
        const updatedSettings = siteApi.generateSettings(allSettings);
        dispatch({
          type: actionTypes.device.MESH_COMMS_STARTED,
          message: 'Saving devices in zone',
        });
        await api.zoneValueSet(newSettings.meshId, updatedSettings);
        // Only save the settings to the server if devices saved first without error.
        await this.saveSettingsObj(newSettings);
        dispatch({ type: actionTypes.device.MESH_COMMS_SUCCESS });
      } else {
        // Save to the server if there are no devices in the zone yet.
        await this.saveSettingsObj(newSettings);
      }
    } catch (err) {
      LOG.console(err);
      this.setState({
        warningMsg: 'There was a problem savings the devices in the zone. Please try again.',
      });
    }
  };

  /**
   * Save settings to the firestore zone document.
   *
   * @param  {} settings
   */
  saveSettingsObj = async (settings) => {
    // Dispatch to firestore
    const { zone, dispatch } = this.props;

    //
    // The firestore device collection listener defined in the datastore saga
    // will update the colletion, however we still need to tell the store that
    // the current device has been updated.
    // Set in firestore -> get from firestore -> dispatch updated doc to store
    //
    await zone.ref.set(settings, { merge: true });
    const newZoneDoc = await zone.ref.get();
    dispatch({ type: actionTypes.site.SET_ZONE, zone: newZoneDoc });

    return newZoneDoc;
  };

  handleIndexChange = (index) => this.setState({ index });

  renderCalibrate = () => {
    const height = Dimensions.get('window').height;
    const modalHeight = height - 100;
    const contentHeight = modalHeight - 50;
    const btnText = this.state.calibrationComplete ? 'Add To Zone' : 'Skip Calibration';

    return (
      <Modal
        avoidKeyboard
        transparent
        backdropOpacity={0.2}
        backdropColor="#000"
        isVisible={this.state.deviceToCalibrate !== null}
        onBackButtonPress={this.onCancelCalibrate}
        onBackdropPress={this.onCancelCalibrate}
        style={appStyles.modal}
      >
        <View style={[appStyles.modalContainer, { height: modalHeight }]}>
          <Dialog.ScrollArea style={{ height: contentHeight }}>
            <ScrollView>
              <Calibrate
                device={this.state.deviceToCalibrate}
                phone={this.props.phone}
                onComplete={this.onCalibrateComplete}
                isCommissioning
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            {!this.state.isCommissioningDevice && (
              <Button onPress={this.onCancelCalibrate}>Cancel</Button>
            )}
            <Button
              onPress={async () => {
                this.setState({ isCommissioningDevice: true });
                await this.saveProvisionedDevice(this.state.deviceToCalibrate);
                // Hide commissioning modal and stop loading animation after commissioning
                this.setState({ isCommissioningDevice: false, deviceToCalibrate: null });
              }}
              loading={this.state.isCommissioningDevice}
              primary
            >
              {btnText}
            </Button>
          </Dialog.Actions>
        </View>
      </Modal>
    );
  };

  renderHeader = (props) => (
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
    const {
      theme,
      discovering,
      devicePressed,
      hasDiscovered,
      zoneDevices,
      zone,
      luxtarget,
      devices,
      pirDelay,
      standbyPercent,
      zone_PIR_enabled,
    } = navigationState;
    const schema = this.settingsSchema();

    const scenes = {
      first: (
        <ZoneDeviceList
          zoneDevices={zoneDevices}
          onZoneDevicePress={this.onZoneDevicePress}
          onZoneDeviceSwitchChange={this.onDeviceFlash}
          onRemoveFromZone={this.onRemoveFromZone}
          onDisconnect={this.onDisconnect}
          theme={theme}
          // itemTitlePrefix={zone.name}
          itemTitlePostfix={(item) => item.serial}
        />
      ),
      second: (
        <View style={appStyles.flexOne}>
          {this.state.deviceToCalibrate && this.renderCalibrate()}
          <DiscoveredDevices
            onLoadDiscoveredDevices={this.onDetectDevice}
            onDiscoveredDevicePress={this.onProvisionDevice}
            onDiscoveredDeviceSwitchChange={(item) => this.onDeviceFlash(item, true, true)}
            onRefresh={this.onDetectDevice}
            onDisconnect={this.onDisconnect}
            discoveredDevices={devices}
            discoveredDevicePressed={devicePressed}
            discovering={discovering}
            hasDiscovered={hasDiscovered}
            theme={theme}
          />
        </View>
      ),
      third: (
        <ScrollView>
          <View style={appStyles.flexOne}>
            <AccordianCard title={`Lux Level: ${luxtarget}`}>
              <SlideMe
                // icon={Constants.ICON.device}
                iconColor={theme.colors.accent}
                highlight={theme.colors.accent}
                maximumValue={500}
                minimumValue={40}
                step={10}
                onSlidingComplete={this.onSaveLuxTarget}
                value={luxtarget}
                thumbTintColor={theme.colors.textLight}
                minimumTrackTintColor={theme.colors.accent2}
                // maximumTrackTintColor={colors.accent2}
              />
            </AccordianCard>
            <Divider />
            <AccordianCard
              title={`PIR Timer: ${pirDelay} minutes`}
              description="Set the time the lights stay active once the PIR is triggered"
            >
              <SlideMe
                highlight={theme.colors.accent}
                maximumValue={60}
                minimumValue={1}
                step={1}
                onSlidingComplete={this.onSavePirDelay}
                value={pirDelay}
                thumbTintColor={theme.colors.textLight}
                minimumTrackTintColor={theme.colors.accent}
                // maximumTrackTintColor={colors.accent2}
              />
            </AccordianCard>
            <Divider />
            <AccordianCard title={`Standby: ${standbyPercent}%`} description="Set standby wattage">
              <SlideMe
                highlight={theme.colors.accent}
                maximumValue={50}
                minimumValue={0}
                minimumLabel="OFF"
                step={1}
                onSlidingComplete={this.onSaveStandbyPercent}
                value={standbyPercent}
                thumbTintColor={theme.colors.textLight}
                minimumTrackTintColor={theme.colors.accent}
                // maximumTrackTintColor={colors.accent2}
              />
            </AccordianCard>
            <Divider />
            <View
              style={[
                appStyles.row,
                appStyles.spreadOut,
                appStyles.spacerHorizontal,
                appStyles.spacerVertical,
              ]}
            >
              <Subheading>Group lights for presence detection</Subheading>
              <SettingSwitch value={zone_PIR_enabled === 1} onSave={this.onSaveZonePirEnabled} />
            </View>
            <Divider />
            <Settings
              isInline
              config={schema}
              modal={false}
              onClose={() => null}
              onEdit={() => {
                this.setState({ detailView: !this.state.detailView });
              }}
            />
          </View>
        </ScrollView>
      ),
    };

    return scenes[route.route.key];
  };

  render() {
    const {
      showDelete,
      isDeleting,
      showRemoveFromZone,
      isRemovingFromZone,
      deviceToRemove,
      warningMsg,
    } = this.state;
    const zone = this.props.zone.data();
    const zoneDevices = siteApi.getDevicesInZone(
      this.props.siteDevices,
      this.state.devices,
      this.props.zone
    );

    /* eslint-disable camelcase */
    const { lux_active, power_saving, time_PIR_expired, zone_PIR_enabled } = zone;
    // There is a 2% buffer added to lux_active.
    const luxtarget = lux_active;
    const standbyPercent = power_saving;
    const pirDelay = time_PIR_expired / 60; // value in seconds but ui is minutes.

    // Figure out initial tab view
    let { index } = this.state;
    if (index === -1) {
      index = zoneDevices.length ? 0 : 1;
    }

    const tabState = {
      ...this.state,
      ...this.props,
      zoneDevices,
      zone,
      index,
      luxtarget,
      pirDelay,
      standbyPercent,
      zone_PIR_enabled,
      devices: this.state.devices,
    };

    return (
      <SafeAreaView style={appStyles.container}>
        {showDelete && (
          <ConfirmDialog
            item={this.props.zone}
            visible={showDelete}
            onShow={this.onDeleteZone}
            onSubmit={this.onDeleteZoneConfirm}
            isSubmitting={isDeleting}
            title="Delete Zone"
            submitText="DELETE"
            text="Deleting a Zone removes all lights from the zone. Do you want to delete this zone?"
          />
        )}

        {showRemoveFromZone && (
          <ConfirmDialog
            item={deviceToRemove}
            visible={showRemoveFromZone}
            onShow={this.onRemoveFromZone}
            onSubmit={this.onRemoveFromZoneConfirm}
            isSubmitting={isRemovingFromZone}
            title="Remove Light"
            submitText="YES"
            text="Do you want to delete this light from the zone?"
          />
        )}

        {warningMsg && (
          <Portal>
            <Dialog visible={warningMsg !== null} onDismiss={this.onCloseWarning}>
              <Dialog.Title>Warning</Dialog.Title>
              <Dialog.Content>
                <Paragraph>{warningMsg}</Paragraph>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={this.onCloseWarning}>OK</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        )}

        {this.state.loading ? (
          <SectionLoader title={`Loading ${zone.name}...`} />
        ) : (
          <View style={appStyles.flexOne}>
            <SectionHeader
              title={zone.name}
              zones={null}
              switches={null}
              devices={zoneDevices.length}
            />

            <TabView
              navigationState={tabState}
              renderScene={(props) => this.renderScene(props, tabState)}
              renderTabBar={this.renderHeader}
              onIndexChange={this.handleIndexChange}
              initialLayout={this.initialLayout}
              swipeEnabled={false}
            />

            <MeshMessage
              visible={this.props.communicating || this.props.deviceMessage}
              msg={this.props.deviceMessage}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }
}

export default withTheme(ZoneDetailScreen);
