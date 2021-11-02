//
// File: screens/Tutorial/TutorialScreen.js
//
import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { withTheme } from 'react-native-paper';
import AppIntroSlider from 'react-native-app-intro-slider';
import { LinearGradient } from 'expo-linear-gradient';
import Navigator from '../../services/navigator';
import Constants from '../../utils/constants';
import appStyles from '../styles';

const tile1 = require('../../assets/images/logo.png');

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  content: {
    marginVertical: 15,
  },
  image: {
    width: 150,
    height: 150,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'left',
    paddingHorizontal: 16,
    lineHeight: 22,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: 16,
  },
});

class SiteTutorialScreen extends React.Component {
  static title = 'Tutorial';

  constructor(props) {
    super(props);

    const { colors } = props.theme;

    this.slides = [
      {
        key: 'tute1',
        title: 'Plan a brilliant implementation',
        text: [
          '1. Plan zones using the site floorplan',
          '2. Customise zone settings to maximise energy savings and meet OH & S requirements',
        ].join('\n'),
        image: tile1,
        imageStyle: styles.image,
        // backgroundColor: colors.primary,
        colors: [colors.accent, colors.primary],
      },
      {
        key: 'tute2',
        title: 'Install with 6 simple steps',
        text: [
          '1. Register your job site',
          '2. Create Zones',
          '3. Configure zone settings',
          '4. Add the lights to the zone',
          '5. Calibrate the lights',
          '6. Send installation report when the job is done',
        ].join('\n'),
        image: tile1,
        imageStyle: styles.image,
        // backgroundColor: colors.primary,
        colors: [colors.accent, colors.primary],
      },
      {
        key: 'tute3',
        title: "Use Litesense's powerful configuration management to maximise energy savings.",
        text: [
          'Set the Lux level to meet the BCA for your workplace',
          'Set the standby time to 0% (off)',
          'Set PIR to miniumum time',
          'Turn off Group lights for presence detection',
          '',
          'Zones are created with the following default settings:',
          '',
          'PIR Timer of 1 minute',
          'Standby time is OFF',
          'Group Lights for presence detection is OFF',
        ].join('\n'),
        image: tile1,
        imageStyle: styles.image,
        // backgroundColor: colors.primary,
        colors: [colors.accent, colors.primary],
      },
    ];
  }

  onSkip = (index) => {
    // Navigate to setup
    Navigator.navigate('Site');
  };

  onDone = () => {
    // Navigate to setup
    Navigator.navigate('Site');
  };

  onNext = (index) => {
    // console.log(index);
  };

  onSlideChange = (index, total) => {
    // (index, total);
  };

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
        data={this.slides}
        renderItem={this.renderItem}
        onDone={this.onDone}
        // bottomButton
        showSkipButton
        onSkip={this.onSkip}
        doneLabel="Get Started"
      />
    );
  }
}

export default withTheme(SiteTutorialScreen);
