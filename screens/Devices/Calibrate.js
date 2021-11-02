//
// File: screens/Devices/Calibrate.js
//
import React from 'react';
import PropTypes from 'prop-types';
import {
  ScrollView,
  SafeAreaView,
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  View,
} from 'react-native';
import {
  Paragraph,
  Title,
  Card,
  CardContent,
  Button,
  List,
} from 'react-native-paper';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
// import { RNLuxDetector, RNEventEmitter } from 'react-native-lux-detector';
// import { LineChart } from 'react-native-chart-kit';

import bleApi from '../../sagas/deviceBleApi';
import AnimatedProgressCircle from '../../components/AnimatedProgressCircle';
import Constants from '../../utils/constants';
import LOG from '../../utils/LOG';
import theme from '../../utils/theme';
import appStyles from '../styles';
import styles from './styles';

const { RNLuxDetector, RNEventEmitter } = NativeModules;

export default class Calibrate extends React.Component {
  constructor(props) {
    super(props);
    this.subscription = null;
    this.state = {
      isCalibrating: false,
      calibrationMsg: [],
      lux: 0,
      // brightness: 0,
      luxPercent: 60, // initial display only..
      luxQueue: [
        {
          lux: 0,
          reading: '',
        },
      ],
    };
  }

  async componentDidMount() {
    // Android and iOS emit events differently.
    const emitter = Platform.select({
      ios: new NativeEventEmitter(RNEventEmitter),
      android: DeviceEventEmitter,
    });
    // Android and iOS calculate the lux differently.
    const eventHandler = Platform.select({
      ios: this.oniOSEventDetected,
      android: this.onAndroidEventDetected,
    });
    
    try {
      activateKeepAwake('calibrate');
      this.subscription = emitter.addListener('onLuxDetected', eventHandler);
      await RNLuxDetector.start();
    } catch (ex) {
      LOG.console('componentDidMount error', ex);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.capturing !== undefined &&
      prevProps.capturing !== undefined &&
      this.props.capturing !== prevProps.capturing
    ) {
      if (this.props.capturing) {
        RNLuxDetector.start();
      } else {
        RNLuxDetector.stop();
      }
    }
  }

  componentWillUnmount() {
    try {
      deactivateKeepAwake('calibrate');
      RNLuxDetector.stop();
      this.subscription.remove();
    } catch (ex) {
      LOG.console('componentWillUnmount error', ex);
    }
  }

  /**
   * Native module event listener for iOS camera brightness detection events.
   * Magic numbers taken from Luxi iOS App as per client spec.
   */
  oniOSEventDetected = (event) => {
    LOG.console('iOS Sensor Event Detected', event);

    const brightness = parseFloat(event.brightness);

    // ev 100
    const iso100 = 100;
    const ev100 = brightness + Math.log2(iso100 * 0.2973);

    // lux
    // https://photo.stackexchange.com/questions/10093/how-to-calculate-lux-from-ev
    const luxModifier = 1;
    const luxCalibrationValue = 0.4 + luxModifier;
    const lux = Math.pow(2, ev100) * 2.5 * luxCalibrationValue;

    this.updateLuxState(brightness, lux);
  };

  /**
   * Native module event listener for Android light sensor events.
   *
   *
   * The magic numbers here were used in the Luxi app, and they are here to help with
   * the filter attachment.
   */
  onAndroidEventDetected = (event) => {
    // LOG.console('Android Sensor Event Detected', event);
    const brightness = parseFloat(event.brightness);
    const exponent = Math.pow(10, -5);
    const lux = -2 * exponent * Math.pow(brightness, 2) + 4.5 * brightness + 270;
    // const lux = brightness;

    this.updateLuxState(brightness, lux);
  };

  onCalibrate = async () => {
    if (this.state.isCalibrating) return;
    this.setState({ isCalibrating: true, calibrationMsg: [] });
    await this.calibrate();
    // dispatch({ type: actionTypes.device.CALIBRATION_START, deviceid: deviceData.id });
  };

  setCalibrationState = (msg, isCalibrating = true) => {
    const { calibrationMsg } = this.state;
    calibrationMsg.unshift(msg);
    this.setState({ calibrationMsg, isCalibrating });
  };

  getConnectTo = async () => {
    const { device, isCommissioning } = this.props;

    // Connect to the device if this is part of a commissioning process as the device
    // will not be part of the network.
    if (isCommissioning) return device;

    // Attempt to connect to the device beiing calibrated by
    // providing the serial number to look for.
    const { serial } = device;
    const connectTo = await bleApi.getConnectionCandidate(null, serial);

    return connectTo;
  };

  // calibration
  // as I understand it:
  // - go to manual set PWM mode for dimmable lights or on/off mode for non-dimmable lights
  // - phone steps through the PWM range and collects camera and light sensor readings
  // - phone calculates table and uploads it
  // commands used are: SET_AUTO_MANUAL, GET_SENSOR_DATA, SET_CALIBRATION_TABLE
  // can use SET_AUTO_MANUAL to turn off a whole zone so we can do 1 light at a time?
  calibrate = async () => {
    const { serial } = this.props.device;
    const { isCommissioning, onComplete } = this.props;
    const connectTo = await this.getConnectTo();

    try {
      // First reset the calibration table.
      this.setCalibrationState({ title: 'Resetting calibration settings...' });
      const infoPacket = await bleApi.getInfo(serial, connectTo);
      if (!infoPacket.isOK) { throw new Error('Unable to retrieve device information. Please try again.'); }

      // Only set the default calibration table if this light has been calibrated before.
      if (infoPacket.data.calibrated) {
        await bleApi.setDefaultCalibrationTable(serial, connectTo);
        // Wait 2 seconds to allow for the lamp to apply settings.
        await bleApi.delay(2000);
      }

      // Then add the new calibration table by interpreting phone lux and lamp lux
      // at different lamp power intervals.
      const maxPowerX100 = await bleApi.getLampMaxPower(serial, connectTo);
      const recordings = await this.calibrateStep(serial, [], maxPowerX100, 0);
      const calibrationTable = bleApi.generateCalibrationTable(recordings);

      this.setCalibrationState({ title: 'Updating calibration settings. Please wait...' });
      await bleApi.setCalibrationTable(serial, calibrationTable, 0, connectTo);

      // Do not reboot if this is part of a commissioning process as that will happen once the
      // light is commissioned.
      if (isCommissioning) {
        this.setCalibrationState({ title: 'Calibration Complete.' }, false);
      } else {
        this.setCalibrationState({ title: 'Calibration Complete. Rebooting...' }, false);
        await bleApi.reboot(serial, connectTo);
      }

      onComplete(this.props.device);
    } catch (err) {
      this.setCalibrationState({ title: 'Error!', description: err.message }, false);
    }
  };

  /**
   * A calibration step involves reading the lux at device and phone level, then increamenting
   * the power by (100 / 9)%, then taking the readings again. From this we can then work out the
   * slope (m) using the average lux reading of two points, the y intercept at 0,
   * and the min and max lux readings.
   *
   * @param  {} serial
   * @param  {} recordings
   * @param  {} maxPowerX100
   * @param  {} pwmPercent=0
   */
  calibrateStep = async (serial, recordings = [], maxPowerX100, powerPercent = 0) => {
    const maxEntries = 3; // The first entry will be discarded before SET_CALIBRATION_TABLE is run
    const powerPercentIncrement = 50; // From 0 to 100 over 3 steps
    const connectTo = await this.getConnectTo();

    if (powerPercent === 0) {
      // Turn the lamp off for the first reading.
      const offPacket = await bleApi.setOnOff(serial, false, connectTo);
      if (!offPacket.isOK) {
        throw new Error(`There was a problem turning the power off. Please try again. Status: ${
          offPacket.status
        }`);
      }
    } else {
      // If power is greater than 0 then set lamps the pwm
      const powerPacket = await bleApi.setPowerPercent(
        serial,
        maxPowerX100,
        powerPercent,
        connectTo,
      );
      if (!powerPacket.isOK) {
        throw new Error(`There was a problem settings the power. Please try again. Status: ${powerPacket.status}`);
      }
    }

    // Wait 2 seconds before measuring to allow time for lamp to change brightness.
    await bleApi.delay(2000);

    const { luxPhone, luxLamp } = await this.captureCalibrationReading(serial);
    recordings.push({ luxPhone, luxLamp });
    this.setCalibrationState({
      title: `Recording ${powerPercent}% of ${Math.ceil(maxPowerX100 / 100)} watts`,
      description: `Lamp Lux: ${luxLamp} Phone Lux: ${luxPhone}`,
    });

    if (recordings.length < maxEntries) {
      return this.calibrateStep(
        serial,
        recordings,
        maxPowerX100,
        powerPercent + powerPercentIncrement,
      );
    }

    return recordings;
  };

  captureCalibrationReading = async (serial) => {
    const connectTo = await this.getConnectTo();

    // Get the light lux level
    const sensorPacket = await bleApi.getSensorData(serial, connectTo);
    if (!sensorPacket.isOK) {
      throw new Error(`There was a problem getting the sensor data. Status: ${sensorPacket.status}`);
    }
    // sensorPacket will not have data if the firmware is out of date.
    const luxLamp = sensorPacket.data ? sensorPacket.data.lux_instant : 0; // light lux reading

    // Get the phone lux level
    const luxPhone = this.state.lux;

    return { luxPhone, luxLamp };
  };

  updateLuxState = (brightness, lux) => {
    // const b = Math.round(brightness * 100) / 100;
    // const l = Math.round(lux * 100) / 100;

    // The admin database supports setting specific luxModifier value
    // for specific phones to account for differences in how they read light.
    const luxmodifier = this.props.phone.luxmodifier || 1;

    // We only care about the int values.
    const b = Math.ceil(brightness);
    const l = Math.ceil(lux * luxmodifier);
    const MAX_LUX_DISPLAY = 5000;
    const luxPercent = Math.ceil((lux / MAX_LUX_DISPLAY) * 100);
    const { luxQueue } = this.state;
    luxQueue.push({
      lux: l,
      reading: '',
    });
    if (luxQueue.length > 10) {
      luxQueue.shift();
    }

    this.setState({
      // brightness: b,
      lux: l,
      luxPercent,
      luxQueue,
    });
  };

  roundUp = num => (num == null ? 0 : (Math.round(num * 100) / 100).toFixed(2));

  render() {
    const { device } = this.props;
    const btnText = device && device.calibrated ? 'Recalibrate' : 'Calibrate';
    const {
      lux,
      luxPercent,
      isCalibrating,
      calibrationMsg, // luxQueue,
    } = this.state;

    // The following data is calculated for the chart which is disabled at the moment.
    // let { width } = Dimensions.get('window');
    // width -= 20;
    // const height = 180;
    // const chartConfig = {
    //   backgroundColor: theme.colors.primary,
    //   backgroundGradientFrom: theme.colors.primary,
    //   backgroundGradientTo: theme.colors.accent,
    //   // color: (opacity = 1) => `rgba(105,105,105, ${opacity})`,
    //   color: (opacity = 1) => theme.colors.paper,
    //   style: {
    //     borderRadius: 5,
    //   },
    // };
    // const graphStyle = {
    //   marginVertical: 0,
    //   marginHorizontal: 10,
    //   padding: 5,
    //   ...chartConfig.style,
    // };
    // const data = {
    //   labels: luxQueue.map(l => l.reading),
    //   datasets: [
    //     {
    //       data: luxQueue.map(l => l.lux),
    //     },
    //   ],
    // };
    return (
      <SafeAreaView style={appStyles.container}>
        <ScrollView>
          <Card elevation={0} style={{ margin: 0 }}>
            <Card.Content>
              {/* <Title>Detected lux: {lux}</Title>
              <View style={styles.luxContainer}>
                <AnimatedProgressCircle
                  percent={luxPercent}
                  radius={70}
                  borderWidth={2}
                  color={theme.colors.accent2}
                  shadowColor={theme.colors.primary}
                  bgColor="#fff"
                  text={lux}
                  subtext="Detected Lux"
                />

                <LineChart
                  data={data}
                  width={width}
                  height={height}
                  chartConfig={chartConfig}
                  bezier
                  style={graphStyle}
                />
              </View> */}

              <Title>Calibrate the light</Title>
              <View>
                <Paragraph>
                  Calibrate the light to ensure maximum energy savings and output in all conditions.
                </Paragraph>
                <Paragraph>
                  Place the filter on the front camera. Face the phone screen towards the light.
                  Make sure it’s away from your body and at waist height.
                </Paragraph>

                <View style={styles.luxContainer}>
                  <AnimatedProgressCircle
                    percent={luxPercent}
                    radius={70}
                    borderWidth={2}
                    color={theme.colors.accent2}
                    shadowColor={theme.colors.primary}
                    bgColor="#fff"
                    text={lux}
                    subtext="Lux"
                  />
                </View>

                <Button
                  style={[appStyles.flexOne, appStyles.spacer]}
                  disabled={isCalibrating}
                  loading={isCalibrating}
                  icon={Constants.ICON.device}
                  onPress={() => this.onCalibrate(lux)}
                  primary
                  raised
                >
                  {btnText}
                </Button>

                {calibrationMsg.length !== 0 && (
                  <List.Section title="Device Calibration">
                    {calibrationMsg.map((m, i) => (
                      <List.Item
                        key={`msg${i}`}
                        title={m.title}
                        description={m.description}
                        style={{ paddingVertical: 0 }}
                      />
                    ))}
                  </List.Section>
                )}
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

Calibrate.propTypes = {
  device: PropTypes.shape({
    serial: PropTypes.number,
  }).isRequired,
  phone: PropTypes.shape({
    luxmodifier: PropTypes.number,
  }).isRequired,
  isCommissioning: PropTypes.bool,
  capturing: PropTypes.bool,
  onComplete: PropTypes.func.isRequired,
};
Calibrate.defaultProps = {
  isCommissioning: false,
  capturing: true,
};
