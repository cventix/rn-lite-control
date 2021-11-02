//
// File: screens/Sites/SiteScreen.js
//
import React from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import { withTheme, Title, Paragraph, Button, Dialog, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Modal from 'react-native-modal';
import * as Sentry from 'sentry-expo';

import NavigatorService from '../../services/navigator';
import { actionTypes } from '../../reducers';
import TextInput from '../../components/FormikTextInput';
import CircleIcon from '../../components/CircleIcon';
import CardList from '../../components/CardList';
import Toolbar from '../../components/Toolbar';
import TouchableView from '../../components/TouchableView';
import MeshMessage from '../../components/MeshMessage';
import SignalIcon from '../../components/SignalIcon';
import Constants from '../../utils/constants';
import bleApi from '../../sagas/deviceBleApi';
import siteApi from '../../sagas/datastoreApi';

import appStyles from '../styles';
import styles from './styles';

const pinFormSchema = Yup.object().shape({
  pin: Yup.string().required('PIN is required').min(4, 'Minimum of 4 numbers'),
});

@connect(store => ({
  user: store.auth.user,
  devices: store.device.devices,
  discovering: store.device.discovering,
  communicating: store.device.communicating,
  deviceMessage: store.device.message,
  fetchingSite: store.site.fetchingSite,
  userSites: store.site.userSites,
}))
class SiteScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const showBack = navigation.getParam('showBack') === true;
    const showDrawer = !showBack;

    return {
      header: () => (
        <Toolbar
          title="Job Sites"
          onDrawerPress={showDrawer && (() => navigation.toggleDrawer())}
          onBackPress={showBack && (() => navigation.state.params.toggleConnect())}
        />
      ),
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      showConnect: false, // connect window
      showSiteSelect: false, // connect window site list
      showDeviceSelect: false, // connect window device select
      authenticateThenRunFunc: null, // Run after device is authenticated.
      deviceToAuthenticate: null, // device authentication prompt.
    };

    props.navigation.setParams({
      toggleConnect: this.onToggleConnect,
      showBack: false,
    });
  }

  async componentDidUpdate(prevProps) {
    // react-navigation keeps components mounted, so check that the current route is
    // correct before operating here.
    if (NavigatorService.getCurrentRoute().routeName !== 'SiteManage') return;

    // If the devices have changed, request additional site information for those devices.
    if (this.props.devices && this.props.devices.length) {
      if (this.props.devices.length > prevProps.devices.length) {
        this.props.dispatch({
          type: actionTypes.site.FETCH_SITES_FOR_DEVICES,
          devices: this.props.devices,
        });
      }
    }
  }

  componentWillUnmount() {
    this.state = { showConnect: false };
  }

  onToggleConnect = stateToUpdate => {
    const show = !this.state.showConnect;

    // Change the header to show/hide the back button.
    this.props.navigation.setParams({ showBack: show });
    if (show) {
      this.setState({ showConnect: show, ...stateToUpdate });
    } else {
      this.setState({
        showConnect: show,
        showDeviceSelect: false,
        showSiteSelect: false,
      });
    }
  };

  onGetSites = () => {
    this.props.dispatch({
      type: actionTypes.site.FETCH_USER_SITES,
      userRef: this.props.user.doc,
    });
  };

  onScan = () => {
    this.props.dispatch({ type: actionTypes.device.DISCOVER });
    this.props.dispatch({ type: actionTypes.device.BLE_GET_CONNECTED });
  };

  onDisconnect = item => {
    this.props.dispatch({ type: actionTypes.device.DISCONNECT, device: item });
  };

  onNewSite = () => {
    this.props.navigation.navigate('SiteNew');
  };

  onSelectDevice = async device => {
    const { siteid } = device;
    // Check if we need to authenticate this device.
    const isAuthenticated = await this.isAuthenticated(device.serial, device);
    if (isAuthenticated) {
      this.onSelectSite(siteid);
    } else {
      this.setState({
        deviceToAuthenticate: device,
        authenticateThenRunFunc: () => this.onSelectSite(siteid),
      });
    }
  };

  onAuthenticate = async (formValues, actions) => {
    const { authenticateThenRunFunc, deviceToAuthenticate } = this.state;
    const { pin } = formValues;
    const isAuthenticated = await bleApi.authenticate(
      deviceToAuthenticate.serial,
      deviceToAuthenticate,
      pin
    );
    if (isAuthenticated) {
      actions.resetForm();
      actions.setSubmitting(false);
      this.onCloseAuthenticate();
      await authenticateThenRunFunc();
    } else {
      actions.setErrors({ invalidPin: 'Incorrect PIN' });
      actions.setSubmitting(false);
    }
  };

  onCloseAuthenticate = () => {
    this.setState({
      authenticateThenRunFunc: null,
      deviceToAuthenticate: null,
    });
  };

  onSelectSite = siteid => {
    this.onToggleConnect();
    this.props.dispatch({ type: actionTypes.site.FETCH_SITE, siteid });
    this.props.navigation.navigate('SiteSelected');
  };

  onShowConnectToSite = () => {
    this.onScan();
    this.onToggleConnect({ showDeviceSelect: true });
  };

  onShowSelectSite = () => {
    this.onGetSites();
    this.onToggleConnect({ showSiteSelect: true });
  };

  onDeviceFlash = async device => {
    const { dispatch } = this.props;
    const isAuthenticated = await this.isAuthenticated(device.serial, device);
    if (isAuthenticated) {
      dispatch({
        type: actionTypes.device.FLASH,
        device,
        connectToDevice: true,
      });
    } else {
      this.setState({
        deviceToAuthenticate: device,
        authenticateThenRunFunc: () => {
          dispatch({
            type: actionTypes.device.FLASH,
            device,
            connectToDevice: true,
          });
        },
      });
    }
  };

  isAuthenticated = async (serial, device) => {
    let isAuthed = await bleApi.isAuthenticated(serial, device);
    if (isAuthed) return true;

    // The device is locked, so check if the user is an owner of the device and unlock if so.
    const deviceSite = await siteApi.getDeviceSite(serial);
    if (deviceSite && deviceSite.userID === this.props.user.uid) {
      isAuthed = await bleApi.authenticate(serial, device, deviceSite.pin);
    }
    return isAuthed;
  };

  renderConnect = () => {
    if (this.state.showDeviceSelect) {
      return this.renderDeviceSelect();
    }
    if (this.state.showSiteSelect) {
      return this.renderUserSites();
    }
    return null;
  };

  renderAuthenticate = () => (
    <Modal
      avoidKeyboard
      transparent
      backdropOpacity={0.2}
      backdropColor="#000"
      isVisible={this.state.deviceToAuthenticate !== null}
      onBackButtonPress={this.onCloseAuthenticate}
      onBackdropPress={this.onCloseAuthenticate}
      style={appStyles.modal}
    >
      <Formik
        initialValues={{ pin: '' }}
        onSubmit={this.onAuthenticate}
        validationSchema={pinFormSchema}
      >
        {props => (
          <Portal.Host>
            <Portal>
              <Dialog
                visible={this.state.deviceToAuthenticate !== null}
                style={appStyles.modalContainer}
              >
                <Dialog.Title>Enter Site PIN Code</Dialog.Title>
                <Dialog.Content>
                  <Paragraph>
                    To connect to this site you must first unlock the light using the Job Site's PIN
                    Code. You can find the PIN in the commission report.
                  </Paragraph>
                  <TextInput
                    name="pin"
                    label="PIN Code"
                    value={props.values.pin}
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="done"
                    onChangeText={props.setFieldValue}
                    onSubmitEditing={props.handleSubmit}
                    autoFocus
                  />
                  {props.errors.pin && <Text style={appStyles.error}>{props.errors.pin}</Text>}
                  {props.errors.invalidPin && (
                    <Text style={appStyles.error}>{props.errors.invalidPin}</Text>
                  )}
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={this.onCloseAuthenticate}>Cancel</Button>
                  <Button onPress={props.handleSubmit} loading={props.isSubmitting} primary>
                    Send
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Portal.Host>
        )}
      </Formik>
    </Modal>
  );

  renderDeviceSelect = () => {
    const deviceList = this.props.devices
      .filter(d => d.siteid !== undefined)
      .map(d => ({ ...d, name: `${d.name.split(' ')[0]} ${d.serial}` }));

    return (
      <View style={appStyles.flexOne}>
        <View style={appStyles.flexOne}>
          <CardList
            items={deviceList}
            theme={this.props.theme}
            title="Select a device to connect to its site"
            emptyText="No provisioned devices found. Try getting closer to the device then pull down to refresh."
            loadingText="Searching for devices..."
            itemDetailTemplate={item => {
              const detail = [];
              if (item.connected) {
                detail.push('Connected');
              } else if (item.signal) {
                detail.push(`Signal strength ${item.signal}`);
              } else {
                detail.push('Disconnected');
              }
              detail.push(item.siteName);
              return detail.join('\n');
            }}
            isLoading={this.props.discovering}
            onRefresh={this.onScan}
            isRefreshing={this.props.discovering}
            actions={item => {
              const actions = [
                {
                  text: 'Flash',
                  onPress: this.onDeviceFlash,
                },
                {
                  text: 'Select',
                  onPress: this.onSelectDevice,
                  primary: true,
                },
              ];

              if (item.connected) {
                actions.push({
                  text: 'Disconnect',
                  onPress: this.onDisconnect,
                });
              }

              return actions;
            }}
            icon={item => {
              if (item.connected) {
                return (
                  <CircleIcon
                    size={24}
                    name={Constants.ICON.device}
                    color="#fff"
                    bgColor={this.props.theme.colors.dark}
                  />
                );
              }
              return (
                <SignalIcon
                  size={24}
                  strength={item.signal}
                  color="#fff"
                  bgColor={this.props.theme.colors.dark}
                />
              );
            }}
          />

          <MeshMessage
            visible={this.props.communicating || this.props.deviceMessage}
            msg={this.props.deviceMessage}
          />
        </View>
        {this.state.deviceToAuthenticate && this.renderAuthenticate()}
      </View>
    );
  };

  renderUserSites = () => (
    <CardList
      items={this.props.userSites}
      theme={this.props.theme}
      title="Select your site"
      emptyText="You do not have any sites yet."
      loadingText="Loading your sites..."
      isLoading={this.props.fetchingSite}
      onRefresh={this.onGetSites}
      isRefreshing={this.props.fetchingSite}
      itemDetailTemplate={item => `${item.creationTime}`}
      actions={item => {
        const actions = [
          {
            text: 'Select',
            onPress: () => this.onSelectSite(item.key),
            primary: true,
          },
        ];

        return actions;
      }}
      icon={item => (
        <CircleIcon
          name={Constants.ICON.site}
          size={24}
          color="#fff"
          bgColor={this.props.theme.colors.accent}
        />
      )}
    />
  );

  render() {
    const { colors } = this.props.theme;

    if (this.state.showConnect) {
      return this.renderConnect();
    }

    return (
      <View style={appStyles.flexOne}>
        <LinearGradient
          style={[
            styles.flexOne,
            styles.siteContainer,
            {
              width: Constants.WIDTH,
              height: Constants.HEIGHT,
            },
          ]}
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0.1 }}
          end={{ x: 0.1, y: 1 }}
        >
          {/* <View style={appStyles.middle}>
            <Image source={tile1} style={styles.siteImage} />
          </View> */}
          <View style={[styles.flexOne, appStyles.middle, styles.siteContent]}>
            <Title style={styles.siteText}>New installation</Title>
            <Paragraph style={styles.siteText}>
              Create a new site to manage the installation
            </Paragraph>
            <TouchableView onPress={this.onNewSite} style={styles.inlineButton}>
              <View style={styles.paperBtn}>
                <Text style={styles.inlineButtonText}>CREATE NEW</Text>
              </View>
            </TouchableView>

            <Title style={[styles.siteText, appStyles.spacerTop]}>Existing installation</Title>
            <Paragraph style={styles.siteText}>
              Stand near a light with a {Constants.APP_NAME} control unit attached to access the
              site
            </Paragraph>
            <TouchableView onPress={this.onShowConnectToSite} style={styles.inlineButton}>
              <View style={styles.paperBtn}>
                <Text style={styles.inlineButtonText}>CONNECT TO SITE</Text>
              </View>
            </TouchableView>

            <Title style={[styles.siteText, appStyles.spacerTop]}>Your installations</Title>
            <Paragraph style={styles.siteText}>
              Select a previous installation from your list.
            </Paragraph>
            <TouchableView onPress={this.onShowSelectSite} style={styles.inlineButton}>
              <View style={styles.paperBtn}>
                <Text style={styles.inlineButtonText}>SELECT SITE</Text>
              </View>
            </TouchableView>
          </View>
        </LinearGradient>
      </View>
    );
  }
}

export default withTheme(SiteScreen);
