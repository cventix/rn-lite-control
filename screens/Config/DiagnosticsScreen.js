//
// File: screens/Config/SoftwareUpdateScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Button, Text, Subheading, Title } from 'react-native-paper';

import api from '../../sagas/deviceBleApi';
import appStyles from '../styles';

const styles = StyleSheet.create({
  middle: {
    flex: 1,
    // flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
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

const DiagnosticsView = (props) => {
  const { user, error, statusMsg, device, navigation } = props;
  return (
    <SafeAreaView style={appStyles.container}>
      <View style={appStyles.content}>
        <View style={styles.middle}>
          <Title>{device.data().name} Diagnostics</Title>
          <Subheading>Diagnostic logs are saved in the database.</Subheading>
          <View>
            <Text>{statusMsg}</Text>
            <Text style={appStyles.error}>{error}</Text>
          </View>
          <View>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={props.onDiagnostics}
              loading={props.isDiagnosticsLoading}
            >
              Run Diagnostics
            </Button>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={props.onSensorData}
              loading={props.isSensorDataLoading}
            >
              Get Sensor Data
            </Button>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={props.onSettings}
              loading={props.isSettingsLoading}
            >
              Get Settings
            </Button>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={props.onInfo}
              loading={props.isInfoLoading}
            >
              Get Info
            </Button>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={props.onLogs}
              loading={props.isLogsLoading}
            >
              Get Last 100 Log Entries
            </Button>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={() => {
                navigation.navigate('SoftwareUpdate');
              }}
              loading={props.isLogsLoading}
            >
              Software Update
            </Button>
            <Button
              style={styles.spacer}
              raised
              primary
              onPress={props.onReboot}
              loading={props.isRebootLoading}
            >
              Reboot
            </Button>
          </View>
        </View>
        <View style={styles.actionContainer}>
          <Text style={styles.footerText}>{user.uid}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

@connect((store) => ({
  user: store.auth.user,
  device: store.site.device,
}))
export default class DiagnosticsScreen extends React.Component {
  static title = 'Diagnostics';

  state = {
    error: null,
    isDiagnosticsLoading: false,
    isLogsLoading: false,
    isSensorDataLoading: false,
    isSettingsLoading: false,
    isInfoLoading: false,
    isRebootLoading: false,
  };

  onSensorData = async () => {
    const { serial } = this.props.device.data();
    this.setState({ isSensorDataLoading: true });
    await this.safeExec(async () => api.getSensorData(serial));
    this.setState({ isSensorDataLoading: false });
  };

  onDiagnostics = async () => {
    const { serial } = this.props.device.data();
    this.setState({ isDiagnosticsLoading: true });
    await this.safeExec(async () => api.getDiagnostics(serial));
    this.setState({ isDiagnosticsLoading: false });
  };

  onSettings = async () => {
    const { serial } = this.props.device.data();
    this.setState({ isSettingsLoading: true });
    await this.safeExec(async () => api.getSettings(serial));
    this.setState({ isSettingsLoading: false });
  };

  onInfo = async () => {
    const { serial } = this.props.device.data();
    this.setState({ isInfoLoading: true });
    await this.safeExec(async () => api.getInfo(serial));
    this.setState({ isInfoLoading: false });
  };

  onLogs = async () => {
    this.setState({ isLogsLoading: true });
    const { serial } = this.props.device.data();
    await this.safeExec(async () => api.getLogs(serial, 100));
    this.setState({ isLogsLoading: false });
  };

  onReboot = async () => {
    this.setState({ isRebootLoading: true });
    const { serial } = this.props.device.data();
    await this.safeExec(async () => api.reboot(serial));
    this.setState({ isRebootLoading: false });
  };

  safeExec = async (fn) => {
    try {
      await fn();
    } catch (err) {
      this.setState({ error: err.message || 'Something went wrong' });
    }
  };

  render() {
    return (
      <DiagnosticsView
        {...this.props}
        error={this.state.error}
        onDiagnostics={this.onDiagnostics}
        isDiagnosticsLoading={this.state.isDiagnosticsLoading}
        onLogs={this.onLogs}
        isLogsLoading={this.state.isLogsLoading}
        onSensorData={this.onSensorData}
        isSensorDataLoading={this.state.isSensorDataLoading}
        onSettings={this.onSettings}
        isSettingsLoading={this.state.isSettingsLoading}
        onInfo={this.onInfo}
        isInfoLoading={this.state.isInfoLoading}
        onReboot={this.onReboot}
        isRebootLoading={this.state.isRebootLoading}
      />
    );
  }
}
