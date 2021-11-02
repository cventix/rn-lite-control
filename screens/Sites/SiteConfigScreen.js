//
// File: screens/Sites/SiteConfigScreen.js
//
import React from 'react';
import { connect } from 'react-redux';

import Settings from '../../components/Settings/Settings';

import siteSettingsSchema from '../../utils/siteSettingsSchema';
import { actionTypes } from '../../reducers';

@connect(store => ({
  site: store.site.site,
  siteDevices: store.site.devices,
}))
class SiteConfigScreen extends React.Component {
  static title = 'Site Config';
  static navigationOptions = ({ navigation }) => ({
    header: null,
  });

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
    const schema = this.settingsSchema();
    return (
      <Settings
        config={schema}
        onClose={() => null}
        modal={false}
        onToggleDrawer={() => this.props.navigation.toggleDrawer()}
      />
    );
  }
}

export default SiteConfigScreen;
