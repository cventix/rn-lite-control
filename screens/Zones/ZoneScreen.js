//
// File: screens/Zones/ZoneScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import { View, SafeAreaView, ScrollView, Modal, Dimensions } from 'react-native';
import { Text, Title, Paragraph, FAB, Subheading, Card, CardContent, Switch } from 'react-native-paper';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { TabBar, TabView } from 'react-native-tab-view';
import { Messages } from 'luxsmart-comms';

import SectionHeader from '../../components/SectionHeader';
import SectionLoader from '../../components/SectionLoader';
import CircleIcon from '../../components/CircleIcon';
import CardList from '../../components/CardList';
import TextInput from '../../components/FormikTextInput';
import Toolbar from '../../components/Toolbar';
import FullScreenEdit from '../../components/FullScreenEdit';
import SlideMe from '../../components/SlideMe';
import Settings from '../../components/Settings/Settings';
import MeshMessage from '../../components/MeshMessage';

import siteSettingsSchema from '../../utils/siteSettingsSchema';

import Constants from '../../utils/constants';
import theme from '../../utils/theme';
import string from '../../utils/string';
import { actionTypes } from '../../reducers';
import appStyles from '../styles';

const addZoneSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .matches(Constants.REGEX_ALPHA, {
      message: Constants.REGEX_ALPHA_MSG,
      excludeEmptyString: true,
    })
    .min(3, 'Minimum of 3 characters')
    .max(13, 'Maximum of 13 characters'),
});

const AddZoneForm = ({
  values, errors, touched, handleSubmit, isSubmitting, setFieldValue, initialValues,
}) => (
  <FullScreenEdit
    nextText="NEXT >"
    backText="< BACK"
    submitText="SAVE"
    isSubmitting={isSubmitting}
    handleSubmit={handleSubmit}
    errors={errors}
    touched={touched}
    values={values}
    initialValues={initialValues}
  >
    <View>
      <TextInput
        autoFocus
        name="name"
        label="Zone Name *"
        value={values.name}
        onChangeText={setFieldValue}
      />
      {touched.name && errors.name && <Text style={appStyles.error}>{errors.name}</Text>}
    </View>

    <View>
      <Subheading style={appStyles.spacer}>Lux Level</Subheading>
      <SlideMe
        // icon={Constants.ICON.device}
        iconColor={theme.colors.accent}
        highlight={theme.colors.accent}
        maximumValue={500}
        minimumValue={40}
        step={10}
        onSlidingComplete={val => setFieldValue('luxtarget', val)}
        value={values.luxtarget}
        thumbTintColor={theme.colors.textLight}
        minimumTrackTintColor={theme.colors.accent2}
        // maximumTrackTintColor={colors.accent2}
      />
      <Subheading style={appStyles.spacerTop}>PIR Timer (minutes)</Subheading>
      <Text style={[appStyles.spacerBottom, { color: theme.colors.secondaryText }]}>Set the time the lights stay active once the PIR is triggered</Text>
      <SlideMe
        highlight={theme.colors.accent}
        maximumValue={60}
        minimumValue={1}
        step={1}
        onSlidingComplete={val => setFieldValue('pirDelay', val)}
        value={values.pirDelay}
        thumbTintColor={theme.colors.textLight}
        minimumTrackTintColor={theme.colors.accent}
        // maximumTrackTintColor={colors.accent2}
      />
      <Subheading style={appStyles.spacerTop}>Standby Percentage</Subheading>
      <Text style={[appStyles.spacerBottom, { color: theme.colors.secondaryText }]}>Set standby wattage</Text>
      <SlideMe
        highlight={theme.colors.accent}
        maximumValue={50}
        minimumValue={0}
        minimumLabel="OFF"
        step={1}
        onSlidingComplete={val => setFieldValue('standbyPercent', val)}
        value={values.standbyPercent}
        thumbTintColor={theme.colors.textLight}
        minimumTrackTintColor={theme.colors.accent}
        // maximumTrackTintColor={colors.accent2}
      />
      <View style={[appStyles.row, appStyles.spreadOut, appStyles.spacerTop]}>
        <Subheading>Group lights for presence detection</Subheading>
        <Switch
          value={values.zone_PIR_enabled}
          onValueChange={() => setFieldValue('zone_PIR_enabled', !values.zone_PIR_enabled)}
        />
      </View>
    </View>
  </FullScreenEdit>
);

const AddZoneDialog = ({ onSave, onShow, visible, initialValues }) => (
  <SafeAreaView style={appStyles.container}>
    <Formik component={AddZoneForm} onSubmit={onSave} validationSchema={addZoneSchema} initialValues={initialValues} />
  </SafeAreaView>
);

const ZoneTab = ({
  hasZones,
  siteZones,
  onZonePress,
  getZoneDeviceCount,
  onAddNew,
  onFlash,
}) => {
  if (hasZones) {
    return (
      <View style={[appStyles.flexOne, { backgroundColor: theme.colors.light }]}>
        <SafeAreaView style={{ flex: 1}}>
          <CardList
              items={siteZones}
              theme={theme}
              itemDetailTemplate={(item) => {
                const deviceCount = getZoneDeviceCount(item);
                return `${item.lux_active} lux assigned to ${deviceCount} light${string.plural(deviceCount)}`;
              }}
              actions={(item) => {
                const actions = [
                  {
                    text: 'Flash',
                    onPress: onFlash,
                  },
                  {
                    text: 'Select',
                    onPress: onZonePress,
                    primary: true,
                  },
                ];
                
                return actions;
              }}
              icon={item => <CircleIcon name={Constants.ICON.zone} size={24} color="#fff" bgColor={theme.colors.accent} />}
            />
          <View style={appStyles.padBottom} />
        </SafeAreaView>
        <View style={appStyles.fabContainer}>
          <FAB icon="plus" onPress={onAddNew} />
        </View>
      </View>
    );
  }

  return (
    <View style={appStyles.flexOne}>
      <ScrollView>
        <Card elevation={0}>
          <Card.Content>
            <Title>Manage your lights</Title>
            <Paragraph>
              {Constants.APP_NAME}'s powerful configuration management lets you apply the same settings to groups of lights using zones.
            </Paragraph>
            <Paragraph>1. Simply create a zone</Paragraph>
            <Paragraph>2. Apply lux and energy saving settings to the zone</Paragraph>
            <Paragraph>3. Tap the zone to add the lights.</Paragraph>
            <Paragraph>Note: All lights should be in a zone.</Paragraph>
          </Card.Content>
        </Card>
        <View style={appStyles.padBottom} />
      </ScrollView>
      <View style={appStyles.fabContainer}>
        <FAB icon="plus" onPress={onAddNew} />
      </View>
    </View>
  );
};

@connect(store => ({
  site: store.site.site,
  siteDevices: store.site.devices,
  siteZones: store.site.zones,
  siteSwitches: store.site.switches,
  fetchingSite: store.site.fetchingSite,
  communicating: store.device.communicating,
  deviceMessage: store.device.message,
}))
class ZoneScreen extends React.Component {
  static title = 'Site Details';

  constructor(props) {
    super(props);

    this.state = {
      showAddNew: false,
      index: 1,
      routes: [{ key: 'first', title: 'Site Details' }, { key: 'second', title: 'Zones' }],
    };

    this.initialLayout = {
      height: 0,
      width: Dimensions.get('window').width,
    };
  }

  onZonePress = (item) => {
    // console.log(`Zone ${item.name} pressed`);
    // Set the current zone to the firebase zone doc reference.
    this.props.dispatch({ type: actionTypes.site.SET_ZONE, zone: item.doc });

    // Each device in a zone should have the same device_settings.
    // Load the deviceSettings store object here from the nearest device.
    // if (this.getZoneDeviceCount(item) > 0) {
    //   this.props.dispatch({
    //     type: actionTypes.device.GET_DATA,
    //     to: item.meshId,
    //     message: Messages.token.GET_SETTINGS,
    //   });
    // }

    this.props.navigation.navigate('ZoneDetail');
  };

  onAddNew = () => {
    this.setState({ showAddNew: !this.state.showAddNew });
  };

  onAddNewSave = async (formValues, { setSubmitting, setErrors }) => {
    const { site, siteZones } = this.props;

    try {
      // Massage the data before inserting into database.
      const settings = {
        name: formValues.name,
        lux_active: formValues.luxtarget,
        power_saving: formValues.standbyPercent,
        power_PIR_expired: formValues.standbyPercent,
        time_PIR_expired: formValues.pirDelay * 60, // UI in minutes but need seconds
        time_saving: formValues.pirDelay * 60, // UI in minutes but need seconds
        zone_PIR_enabled: formValues.zone_PIR_enabled ? 1 : 0,
      };

      // Figure out new zone serial number that will be assigned to devices in this zone.
      let zoneMeshId = Messages.LUXSMART_COMM_ZONE_DEFAULT;
      const idExists = z => z.meshId === zoneMeshId;
      while (siteZones.find(idExists)) zoneMeshId += 1;

      const values = { ...settings, meshId: zoneMeshId };
      site.ref.collection('zones').add(values);
    } catch (e) {
      setErrors(e);
    } finally {
      setSubmitting(false);
      this.onAddNew();
    }
  };

  onSaveSiteSettings = async (key, val) => {
    // Dispatch to firestore
    const { site, dispatch } = this.props;

    //
    // The firestore device collection listener defined in the datastore saga
    // will update the colletion, however we still need to tell the store that
    // the current device has been updated.
    // Set in firestore -> get from firestore -> dispatch updated doc to store
    //
    // await site.ref.set({ [key]: val }, { merge: true });
    await site.ref.update({ [key]: val });
    const newSiteDoc = await site.ref.get();
    dispatch({ type: actionTypes.site.SET_SITE, site: newSiteDoc });

    if (key === 'name') {
      this.props.navigation.setParams({
        title: val,
      });
    }
  };

  onFlash = (item) => {
    const { dispatch } = this.props;
    dispatch({ type: actionTypes.device.FLASH, device: item });
  };

  //
  // Required for settingsHO
  //
  settingsSchema = () =>
    siteSettingsSchema(this.props.site, this.props.siteDevices, this.onSaveSiteSettings, this.props.navigation);

  getZoneDeviceCount = zone =>
    this.props.siteDevices.filter((d) => {
      const device = d.doc.data();
      return device.zoneid === zone.doc.id;
    }).length;

  getUnzonedDevices = () =>
    this.props.siteDevices.filter((d) => {
      const device = d.doc.data();
      return !device.zoneid;
    });

  getDevicesInZone = zone =>
    this.props.siteDevices.filter((d) => {
      const device = d.doc.data();
      return device.zoneid === zone.key;
    });

  handleIndexChange = index => this.setState({ index });

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
    const { siteZones } = navigationState;
    const hasZones = siteZones && siteZones.length > 0;
    const schema = this.settingsSchema();

    const scenes = {
      first: (
        <ScrollView>
          <Settings config={schema} onClose={() => null} modal={false} isInline />
        </ScrollView>
      ),
      second: (
        <ZoneTab
          hasZones={hasZones}
          siteZones={siteZones}
          onZonePress={this.onZonePress}
          onAddNew={this.onAddNew}
          onFlash={this.onFlash}
          getZoneDeviceCount={this.getZoneDeviceCount}
        />
      ),
    };

    return scenes[route.route.key];
  };

  render() {
    const {
      siteDevices, siteSwitches, siteZones, fetchingSite, site,
    } = this.props;
    const { showAddNew } = this.state;
    // const loading = siteZones === null;
    const siteName = (site && site.data) ? site.data().name : 'Loading...';
    const tabState = {
      ...this.state,
      ...this.props,
    };
    const initialValues = {
      zone_PIR_enabled: false,
      luxtarget: 400,
      standbyPercent: 0,
      pirDelay: 1,
      name: '',
    };

    return (
      <SafeAreaView style={appStyles.container}>
        {fetchingSite ? (
          <SectionLoader title="Loading..." />
        ) : (
          <View style={appStyles.flexOne}>
            <Modal visible={showAddNew} onRequestClose={this.onAddNew} animationType="slide">
              <View style={appStyles.flexOne}>
                <Toolbar title="Add New Zone" onModalClose={this.onAddNew} />
                <AddZoneDialog onShow={this.onAddNew} onSave={this.onAddNewSave} initialValues={initialValues} />
              </View>
            </Modal>
            <SectionHeader
              title={siteName}
              devices={siteDevices.length}
              zones={siteZones.length}
              switches={siteSwitches.length}
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
          </View>
        )}
      </SafeAreaView>
    );
  }
}

export default ZoneScreen;
