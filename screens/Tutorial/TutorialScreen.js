//
// File: screens/Tutorial/TutorialScreen.js
//
import React from 'react';
import { StyleSheet, View, Text, Image, Platform, PermissionsAndroid } from 'react-native';
import { withTheme } from 'react-native-paper';
import AppIntroSlider from 'react-native-app-intro-slider';
import { LinearGradient } from 'expo-linear-gradient';

import Navigator from '../../services/navigator';

import Constants from '../../utils/constants';
import LOG from '../../utils/LOG';
import appStyles from '../styles';

const tile1 = require('../../assets/images/logo.png');

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  content: {
    marginHorizontal: 5,
  },
  image: {
    width: 280,
    height: 280,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: 16,
  },
});

class TutorialScreen extends React.Component {
  static title = 'Tutorial';

  constructor(props) {
    super(props);

    const { colors } = props.theme;

    this.state = {
      hasPermission: true,
      deniedPermission: false,
      slides: [
        {
          key: 'tute1',
          title: 'Brilliant Simplicity',
          text: [`Welcome to ${Constants.APP_NAME}`].join('\n'),
          image: tile1,
          imageStyle: styles.image,
          // backgroundColor: colors.primary,
          colors: [colors.accent, colors.primary],
        },
      ],
    };

    this.permSlides = [
      {
        key: 'tute2',
        title: 'We Use Bluetooth',
        text: [
          'Location Services are required for bluetooth devices.',
          '\n',
          'Click next and then accept to continue.',
        ].join('\n'),
        image: tile1,
        imageStyle: styles.image,
        // backgroundColor: colors.primary,
        colors: [colors.accent, colors.primary],
      },
      {
        key: 'tute3',
        title: 'Requesting Permission...',
        text: [
          'Please allow to continue.',
          '\n',
          'You can enable location services in your phone settings.',
        ].join('\n'),
        image: tile1,
        imageStyle: styles.image,
        // backgroundColor: colors.primary,
        colors: [colors.accent, colors.primary],
      },
    ];
  }

  componentDidMount() {
    this.checkPermission();
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if (!prevState) {
  //     return;
  //   }

  //   const { hasPermission } = this.state;
  //   if (!hasPermission) {
  //     if (prevState.hasPermission !== hasPermission) {
  //       const slides = this.state.slides.concat(this.permSlides);
  //       this.setState({ slides });
  //     }
  //   }
  // }

  onDone = () => {
    // Navigate to setup
    Navigator.navigate('Site');
  };

  onNext = (index) => {
    // LOG.console(index);
  };

  onSlideChange = (index, total) => {
    LOG.console(index, total);
    if (index === 2) {
      this.requestPermission();
    }
  };

  checkPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
        .then((result) => {
          if (result) {
            LOG.console('Permission OK');
          } else {
            LOG.console('No Permission');

            // Add permission slides to tute.
            const slides = this.state.slides.concat(this.permSlides);
            this.setState({ hasPermission: false, slides });
          }
        })
        .catch(err => LOG.console('No ble support on this device', err));
    }
  }

  requestPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
        if (result) {
          LOG.console('User accept');
          // this.setState({ hasPermission: true });
          this.onDone();
        } else {
          LOG.console('User refuse');
          this.setState({ deniedPermission: true });
        }
      });
    }
  }

  renderItem = props => (
    <View style={appStyles.flexOne}>
      <LinearGradient
        style={[
          styles.mainContent,
          {
            paddingTop: props.item.topSpacer,
            paddingBottom: props.item.bottomSpacer,
            width: Constants.WIDTH,
            height: Constants.HEIGHT,
          },
        ]}
        colors={props.item.colors}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
      >
        <Image source={props.item.image} style={props.item.imageStyle} />
        <View style={styles.content}>
          <Text style={styles.title}>{props.item.title}</Text>
          <Text style={styles.text}>{props.item.text}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  render() {
    return (
      <AppIntroSlider
        data={this.state.slides}
        renderItem={this.renderItem}
        onDone={this.onDone}
        onSlideChange={this.onSlideChange}
        doneLabel="Continue"
      />
    );
  }
}

export default withTheme(TutorialScreen);
