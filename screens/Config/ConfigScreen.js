//
// File: screens/Config/ConfigScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { Headline, Button, Text } from 'react-native-paper';
// import { Headline, Button, Text, Switch } from 'react-native-paper';
// import Constants from '../../utils/constants';
// import LocalStorage from '../../lib/Categories/LocalStorage';

// import Anchor from '../../components/Anchor';

import appStyles from '../styles';

const styles = StyleSheet.create({
  actionContainer: {
    height: 70,
  },
  footer: {
    height: 50,
    alignItems: 'center',
  },
  spacer: {
    marginVertical: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  row: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  padRight: {
    marginRight: 5,
  },
});

@connect(store => ({
  user: store.auth.user,
}))
class ConfigScreen extends React.Component {
  static title = 'Account Details';

  // constructor(props) {
  //   super(props);

  //   this.state = {
  //     debug: LocalStorage.getItem('DEBUG') === true,
  //   };
  // }

  onSignout = () => {
    this.props.navigation.navigate('SignOut');
  };

  // onDebugChanged = (debug) => {
  //   LocalStorage.setItem('DEBUG', debug);
  //   this.setState({ debug });
  // };

  render() {
    const user = this.props.user || {};

    return (
      <SafeAreaView style={appStyles.container}>
        <View style={appStyles.content}>
          <View style={appStyles.middle}>
            {user.displayName && <Headline>{user.displayName}</Headline>}
            {user.email && <Headline>{user.email}</Headline>}
            {user.installer_id && <Headline>{user.installer_id}</Headline>}

            <Button style={styles.spacer} raised primary onPress={this.onSignout}>
              Sign Out
            </Button>
          </View>
          <View style={styles.actionContainer}>
            {/* <View style={styles.row}>
              <Text style={styles.padRight}>Send usage data to {Constants.APP_NAME}</Text>
              <Switch value={this.state.debug} onValueChange={this.onDebugChanged} />
            </View> */}
            <Text style={styles.footerText}>{user.uid}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default ConfigScreen;
