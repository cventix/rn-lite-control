//
// File: screens/Splash/SplashScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import codePush from "react-native-code-push";
import { Image, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import SectionLoader from '../../components/SectionLoader';
import theme from '../../utils/theme';
import Constants from '../../utils/constants';
import styles from './styles';

const logo = require('../../assets/images/logo.png');

const bottomSpacer = (Constants.IS_IPHONEX ? 34 : 0) + 64;
const topSpacer =
  (Constants.IS_IPHONEX ? 44 : 0) + (Platform.OS === 'ios' ? 20 : StatusBar.currentHeight) + 64;

@connect(store => ({
  user: store.auth.user,
  userSet: store.auth.userSet,
}))
class SplashScreen extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.userSet) {
      nextProps.navigation.navigate(nextProps.user ? 'App' : 'Auth');
    }
  }

  componentDidMount() {
    // Checks if any new ota update is available
    codePush.sync({
      updateDialog: true,
      installMode: codePush.InstallMode.IMMEDIATE,
    });
  }

  render() {
    const { colors } = theme;

    return (
      <LinearGradient
        colors={[colors.accent, colors.primary]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
        style={[
          styles.container,
          {
            paddingTop: topSpacer,
            paddingBottom: bottomSpacer,
            width: Constants.WIDTH,
            height: Constants.HEIGHT,
          },
        ]}
      >
        <Image source={logo} style={styles.image} />
        <SectionLoader title="Brilliant Simplicity" isLight />
      </LinearGradient>
    );
  }
}

export default SplashScreen;
