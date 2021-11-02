//
// File: screens/Config/SoftwareUpdateScreen.js
//
import React from 'react';
import { connect } from 'react-redux';
import { View, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { Button, Text, ProgressBar } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import { useKeepAwake } from 'expo-keep-awake';
import { Messages, IMessages } from 'luxsmart-comms';

// import Constants from '../../utils/constants';
import LOG from '../../utils/LOG';
import appStyles from '../styles';
import firebase from '../../config/firebase';

import api from '../../sagas/deviceBleApi';

const storage = firebase.storage();

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

const ContainerView = (props) => {
  const {
    user, children, error, statusMsg,
  } = props;

  return (
    <SafeAreaView style={appStyles.container}>
      <View style={appStyles.content}>
        <View style={styles.middle}>
          <View>
            <Text>{statusMsg}</Text>
            <Text style={appStyles.error}>{error}</Text>
          </View>
          <View>{children}</View>
        </View>
        <View style={styles.actionContainer}>
          <Text style={styles.footerText}>{user.uid}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const DownloadingView = (props) => {
  useKeepAwake();
  const { downloadProgress, onCancel } = props;
  return (
    <ContainerView {...props}>
      <View>
        <ProgressBar progress={downloadProgress} style={{ width: 250 }} />
        <Button style={styles.spacer} raised onPress={onCancel}>
          Cancel
        </Button>
      </View>
    </ContainerView>
  );
};

const UpdateAvailableView = props => (
  <ContainerView {...props}>
    <View>
      <Button style={styles.spacer} raised primary onPress={props.onUpdate}>
        Update Device Software
      </Button>
      {/* <Button style={styles.spacer} raised primary onPress={props.onReset}>
        Reset Device To Default
      </Button> */}
      {/* <Button style={styles.spacer} raised primary onPress={props.onReboot}>
        Reboot Device
      </Button> */}
    </View>
  </ContainerView>
);

@connect(store => ({
  user: store.auth.user,
  device: store.site.device,
}))
export default class SoftwareUpdateScreen extends React.Component {
  static title = 'Software Update';

  constructor(props) {
    super(props);

    this.state = {
      downloadProgress: 0,
      isDownloading: false,
      isUpdateAvailable: true,
      error: null,
      statusMsg: null,
    };
  }

  onReset = async () => {
    LOG.console('Resetting...');
    this.setState({
      isDownloading: true,
      error: null,
      downloadProgress: 0,
      statusMsg: 'Resetting...',
    });

    try {
      const TO = this.props.device.data().serial;
      // Wait 20 seeconds before timing out for resets.
      const resetPacket = await api.getData(
        TO,
        Messages.token.ERASE_EXTERNAL_FLASH,
        null,
        null,
        null,
        20000,
      );
      LOG.console('Finished resetting. Status:', resetPacket.status);
      this.setState({ statusMsg: 'Reset Complete', error: null, isDownloading: false });
      // Finished so reboot
      api.writeWithoutResponse(TO, Messages.token.REBOOT);
    } catch (e) {
      LOG.console(e);
      this.setState({
        isDownloading: false,
        error: 'There was a problem resetting the software. Please try again.',
        statusMsg: null,
      });
    }
  };

  onUpdate = async () => {
    LOG.console('Updating Software...');

    try {
      // Retrieve the latest firmware version name from the server, then download it.
      this.setState({
        isDownloading: true,
        error: null,
        downloadProgress: 0,
        statusMsg: 'Downloading...',
      });

      const db = firebase.firestore();
      const colRef = db.collection('config');
      const configDoc = await colRef.doc('config').get();
      const fileName = configDoc.data().latestFirmware;

      const firmwareUri = await this.download(fileName);
      LOG.console('Finished downloading to ', firmwareUri);

      this.setState({ statusMsg: 'Installing software update...', downloadProgress: 0 });
      await this.update(firmwareUri);
      this.setState({ statusMsg: 'Finished software update', downloadProgress: 0 });
    } catch (e) {
      LOG.console(e);
      this.setState({
        isDownloading: false,
        error: 'There was a problem installing the software update. Please try again.',
        statusMsg: null,
      });
    }
  };

  onReboot = async () => {
    LOG.console('Rebooting...');
    this.setState({
      isDownloading: true,
      error: null,
      downloadProgress: 0,
      statusMsg: 'Rebooting...',
    });

    try {
      const TO = this.props.device.data().serial;
      await api.reboot(TO);
      this.setState({ statusMsg: 'Finished Rebooting', error: null, isDownloading: false });
    } catch (e) {
      LOG.console(e);
      this.setState({
        isDownloading: false,
        error: 'There was a problem rebooting the device. Please try again.',
        statusMsg: null,
      });
    }
  };

  onCancel = async () => {
    LOG.console('Cancelling update...');
    this.setState({ isDownloading: false, statusMsg: null });

    const TO = this.props.device.data().serial;
    const connectTo = await api.getConnectionCandidate(null, TO);

    const cancelUploadPacket = await api.getData(
      TO,
      Messages.token.FIRMWARE_CANCEL_UPLOAD,
      connectTo,
    );
    LOG.console(`FIRMWARE_CANCEL_UPLOAD status: ${cancelUploadPacket.status}`);
  };

  onDownloadProgress = (downloadProgress) => {
    const progress =
      downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    this.setState({
      downloadProgress: progress,
    });
  };

  isReady = async (TO) => {
    // This promise will resolve once the device is ready.
    const connectTo = await api.getConnectionCandidate(null, TO);
    const isReadyPacket = await api.getData(TO, Messages.token.FIRMWARE_PREPARE_STATUS, connectTo);

    if (isReadyPacket.status === Messages.FLEXIO_COMM_BUSY) {
      // try again after a second.
      await api.delay(1000);
      return this.isReady(TO);
    }
    return isReadyPacket;
  };

  /**
   * Install new firmware.
   * 1. make sure the pin code is sent.
   * 2. send the first line of firmware with  FIRMWARE_PREPARE_UPLOAD.
   * 3. then ask  FIRMWARE_PREPARE_STATUS, if reply is FLEXIO_COMM_BUSY, ask late. if reply is FLEXIO_COMM_CANT, you need to send FIRMWARE_CANCEL_UPLOAD and restart the firmware update. if you get FLEXIO_COMM_OK, you can keep send the rest of lines with command FIRMWARE_UPLOAD.
   * 4. for each 100 lines, you need to send FIRMWARE_UPLOAD_STATUS providing the counter(100 or lower) to check if the device missed any package. if you receive the counter is not equal you has sent, you need to check the seq which is missed and resend it with FIRMWARE_UPLOAD then ask again. if the counter is equal to the number you sent, keep sending the rest till you send all lines out and check with the device to make sure all lines are received.
   * 5. send FIRMWARE_CANCEL_UPLOAD. it will stop the firmware update.
   * 6. reboot the device.
   *
   * @param  {} firmwareUri Path to firmware file.
   * @returns promise
   */
  update = async (firmwareUri) => {
    const TO = this.props.device.data().serial;
    const firmware = await FileSystem.readAsStringAsync(firmwareUri);
    const lines = firmware.split('\n');

    this.setState({ statusMsg: 'Preparing software update...' });
    // Usually there is a blank line at the end of the file so strip that.
    if (lines[lines.length - 1].length === 0) {
      lines.pop();
    }

    // FIRMWARE_PREPARE_UPLOAD first line
    const prepareHex = lines.shift();
    const hexData = new IMessages.HexData(prepareHex);
    // Wait a minute before giving up when preparing the firmware update.
    const connectTo = await api.getConnectionCandidate(null, TO);
    LOG.console('FIRMWARE_PREPARE_UPLOAD', connectTo);
    const preparePacket = await api.setData(
      TO,
      Messages.token.FIRMWARE_PREPARE_UPLOAD,
      hexData,
      connectTo,
      false,
      null,
      60000,
    );

    if (preparePacket.status === Messages.FLEXIO_COMM_CANT) {
      // Something can't complete. Probably trying ot update to the same firmware version.
      throw new Error('FIRMWARE_PREPARE_UPLOAD Could not complete the firmware update.');
    }

    // FIRMWARE_PREPARE_STATUS
    LOG.console('FIRMWARE_PREPARE_STATUS');
    const isReadyPacket = await this.isReady(TO);
    if (isReadyPacket.status === Messages.FLEXIO_COMM_CANT) {
      // FIRMWARE_CANCEL_UPLOAD if FIRMWARE_PREPARE_STATUS is can't
      const cancelUploadPacket = await api.getData(
        TO,
        Messages.token.FIRMWARE_CANCEL_UPLOAD,
        connectTo,
      );
      LOG.console(`FIRMWARE_CANCEL_UPLOAD status: ${cancelUploadPacket.status}`);
      await api.delay(5000);
      // Resart the firmware process
      return this.update(firmwareUri);
    } else if (!isReadyPacket.isOK) {
      // Something went wrong so stop here.
      throw new Error('FIRMWARE_PREPARE_STATUS could not complete');
    }

    // Firmware Update (lines > 0 && lines < lines.length - 1)
    await this.writeFirmwareChunked(TO, lines, 0);

    // Finish the firmware update
    LOG.console('Finalising software update...');
    this.setState({ statusMsg: 'Finalising software update...' });
    await api.writeWithoutResponse(TO, Messages.token.FIRMWARE_CANCEL_UPLOAD, null, connectTo);

    LOG.console('Rebooting...');
    this.setState({ statusMsg: 'Rebooting...' });
    // Finished so reboot
    await api.writeWithoutResponse(TO, Messages.token.REBOOT, null, connectTo);
  };

  verifyChunk = async (TO, lines, sentCount, maxByteSize) => {
    if (!this.state.isDownloading) {
      // Break out of recursive function if the cancel button is pressed.
      return;
    }
    const fw_check = new IMessages.fw_check_t();
    fw_check.counter = sentCount; // next 100

    const connectTo = await api.getConnectionCandidate(null, TO);
    const verifyPacket = await api.setData(
      TO,
      Messages.token.FIRMWARE_UPLOAD_STATUS,
      fw_check,
      connectTo,
      false,
      null,
      5000,
    );

    if (
      verifyPacket.data.counter !== fw_check.counter ||
      verifyPacket.status !== Messages.FLEXIO_COMM_OK
    ) {
      LOG.console(`Resending ${verifyPacket.data.missed_package_seq}`);
      let hexData = null;
      if (lines.length > verifyPacket.data.missed_package_seq) {
        if (verifyPacket.data.missed_package_seq == (lines.length - 1)) {
          hexData = new IMessages.HexData(lines[verifyPacket.data.missed_package_seq - 1]);
        } else {
          hexData = new IMessages.HexData(lines[verifyPacket.data.missed_package_seq]);
        }
        
        await api.writeWithoutResponse(TO, Messages.token.FIRMWARE_UPLOAD, hexData, connectTo);
      }

      // Check again until all verified.
      await this.verifyChunk(TO, lines, sentCount, maxByteSize);
    }
  };

  writeFirmwareChunked = async (TO, lines, index) => {
    if (!this.state.isDownloading) {
      // Break out of recursive function if the cancel button is pressed.
      return;
    }

    const connectTo = await api.getConnectionCandidate(null, TO);
    const chunkSize = 100;
    const maxByteSize = 20;
    const queueSleepTime = 20;
    const nextIndex = index + chunkSize;
    const chunk = lines.slice(index, nextIndex);
    const packets = chunk.map((c) => {
      if (!c) return null;
      const packet = api.createPacket(TO, Messages.token.FIRMWARE_UPLOAD, new IMessages.HexData(c));
      return packet;
    });

    if (packets.length) {
      this.setState({
        downloadProgress: Number(Number(index / chunkSize / (lines.length / chunkSize)).toFixed(4)),
        statusMsg: `Installing ${index / chunkSize + 1} of ${Math.ceil(lines.length / chunkSize)}`,
      });
      
      let sentCount = 0;
      for (let i = 0; i < packets.length; i += 1) {
        if (!this.state.isDownloading) return;
        if (packets[i]) {
          // No notifications sent from firmware data upload so write
          // without response / notification expectation.
          // eslint-disable-next-line no-await-in-loop
          await api.writeWithoutNotification(packets[i], maxByteSize, queueSleepTime, connectTo);
          // eslint-disable-next-line no-await-in-loop
          sentCount += 1;

          // On iPhone we need an additional delay.
          if (Platform.OS === 'ios') {
            // eslint-disable-next-line no-await-in-loop
            await api.delay(1);
          }
        }
      }

      // Verify last 100 lines have been accepted and resend if not.
      LOG.console(`Verifying block ${index / chunkSize}`);
      await this.verifyChunk(TO, lines, sentCount, maxByteSize);
    }

    if (index < lines.length - 1) {
      try {
        await this.writeFirmwareChunked(TO, lines, nextIndex);
        // await this.writeFirmwareChunked(TO, peripheral, lines, nextIndex);
      } catch (e) {
        LOG.console('Error writing firmware', e);
        throw new Error(e);
      }
    } else {
      this.setState({ isDownloading: false, statusMsg: 'Completed installing package' });
    }
  };

  download = async (fileName) => {
    try {
      const remotePath = `firmware/${fileName}`;
      const pathReference = storage.ref(remotePath);
      const downloadURL = await pathReference.getDownloadURL();
      const localPath = FileSystem.documentDirectory + fileName;
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        LOG.console('File already exists so skipping download');
        return localPath;
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadURL,
        localPath,
        {},
        this.onDownloadProgress,
      );

      await downloadResumable.downloadAsync();
      return localPath;
    } catch (e) {
      throw Error(e);
    }
  };

  render() {
    const {
      isDownloading, isUpdateAvailable, downloadProgress, error, statusMsg,
    } = this.state;

    if (isDownloading) {
      return (
        <DownloadingView
          {...this.props}
          onCancel={this.onCancel}
          downloadProgress={downloadProgress}
          error={error}
          statusMsg={statusMsg}
        />
      );
    }

    if (isUpdateAvailable) {
      return (
        <UpdateAvailableView
          {...this.props}
          onUpdate={this.onUpdate}
          onReset={this.onReset}
          onReboot={this.onReboot}
          error={error}
          statusMsg={statusMsg}
        />
      );
    }

    return (
      <View>
        <Text>Nothing to do...</Text>
      </View>
    );
  }
}
