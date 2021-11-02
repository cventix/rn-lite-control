//
// File: screens/Swtiches/SwitchScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import { View, SafeAreaView } from 'react-native';
import { Headline, withTheme } from 'react-native-paper';
import { MaterialIcons as Icon } from 'react-native-vector-icons';

import SectionHeader from '../../components/SectionHeader';
import settingsHOC from '../../components/Settings';

import siteSettingsSchema from '../../utils/siteSettingsSchema';
import { actionTypes } from '../../reducers';
import appStyles from '../styles';

import Constants from '../../utils/constants';

@connect(store => ({
  site: store.site.site,
  siteDevices: store.site.devices,
  siteZones: store.site.zones,
  siteSwitches: store.site.switches,
}))
@settingsHOC
class SwitchScreen extends React.Component {
  static title = 'Switch Panels';

  constructor(props) {
    super(props);

    props.navigation.setParams({
      title: props.site.data().name,
    });
  }

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

  //
  // Required for settingsHO
  //
  settingsSchema = () =>
    siteSettingsSchema(this.props.site, this.props.siteDevices, this.onSaveSiteSettings);

  render() {
    // const site = this.props.site.data();
    const {
      siteDevices, siteSwitches, siteZones, theme,
    } = this.props;

    return (
      <SafeAreaView style={appStyles.container}>
        <SectionHeader
          title="Switch Panels"
          devices={siteDevices.length}
          zones={siteZones.length}
          switches={siteSwitches.length}
        />
        <View style={[appStyles.content, appStyles.middle]}>
          <View style={appStyles.circleIconContainer}>
            <Icon
              style={appStyles.circleIcon}
              name={Constants.ICON.switch}
              color={theme.colors.textLight}
              size={128}
            />
          </View>
          <Headline style={appStyles.spacer}>Switch Panels Coming Soon...</Headline>
        </View>
      </SafeAreaView>
    );
  }
}

export default withTheme(SwitchScreen);
