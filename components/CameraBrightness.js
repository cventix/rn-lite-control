//
// File: components/Camera.js
//
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Camera, Permissions, FileSystem } from 'expo';

const crosshair = {
  width: 100,
  height: 100,
  radius: 50,
  camWidth: 200,
  camHeight: 200,
  border: 4,
};

const styles = StyleSheet.create({
  container: {
    margin: 0,
    marginVertical: 10,
  },
  camContainer: {
    height: crosshair.camHeight,
    alignItems: 'center',
  },
  cam: {
    height: crosshair.camHeight,
    width: crosshair.camWidth,
    borderRadius: 5,
  },
  crosshairContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  crosshair: {
    width: crosshair.width,
    height: crosshair.height,
    borderRadius: crosshair.radius,
    borderWidth: crosshair.border,
    borderColor: '#fff',
  },
  lineLeft: {
    position: 'absolute',
    left: 0,
    width: crosshair.camWidth / 2 - crosshair.width / 2,
    height: crosshair.border,
    backgroundColor: '#fff',
  },
  lineRight: {
    position: 'absolute',
    right: 0,
    width: crosshair.camWidth / 2 - crosshair.width / 2,
    height: crosshair.border,
    backgroundColor: '#fff',
  },
  lineTop: {
    position: 'absolute',
    top: 0,
    height: crosshair.camHeight / 2 - crosshair.height / 2,
    width: crosshair.border,
    backgroundColor: '#fff',
  },
  lineBottom: {
    position: 'absolute',
    bottom: 0,
    height: crosshair.camHeight / 2 - crosshair.height / 2,
    width: crosshair.border,
    backgroundColor: '#fff',
  },
  results: {
    // padding: 10,
  },
  text: {
    fontSize: 14,
    marginVertical: 10,
    textAlign: 'center',
  },
});

class CameraBrightness extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.front,
    brightness: 'Undetected',
  };

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  componentWillUnmount() {
    this.camera = null;
  }

  roundUp = num => (num == null ? 0 : (Math.round(num * 100) / 100).toFixed(2));

  snap = async () => {
    if (this.camera) {
      const photo = await this.camera.takePictureAsync({ exif: true });
      FileSystem.deleteAsync(photo.uri);

      // console.log('Photo', photo);
      const { exif } = photo;
      if (exif) {
        this.setState({
          brightness: this.roundUp(exif.BrightnessValue),
          // iso: exif.ISOSpeedRatings[0],
          // fstop: exif.FNumber,
          // exposureTime: exif.ExposureTime,
        });
      }
      this.props.onSnap(photo);
    }
  };

  start = () => {
    this.started = true;
    this.snapTimer();
  };

  stop = () => {
    this.started = false;
  };

  snapTimer = () => {
    if (this.started) {
      setTimeout(() => {
        this.snap();
        this.snapTimer();
      }, 1000);
    }
  };

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>Please enable access to the camera in your system settings.</Text>;
    }
    return (
      <View style={styles.container}>
        <View style={styles.camContainer}>
          <Camera
            style={styles.cam}
            type={this.state.type}
            ref={(ref) => {
              this.camera = ref;
            }}
            autoFocus={Camera.Constants.AutoFocus.on}
            onCameraReady={() => {
              // console.log('camera invokved');
            }}
            // ratio="16:9"
          >
            <View style={styles.crosshairContainer}>
              <View style={styles.crosshair} />
              <View style={styles.lineLeft} />
              <View style={styles.lineTop} />
              <View style={styles.lineBottom} />
              <View style={styles.lineRight} />
            </View>
          </Camera>
        </View>
        <View style={styles.results}>
          <Text style={styles.text}>Brightness: {this.state.brightness}</Text>

          <Button primary raised onPress={() => this.snap()}>
            {this.props.btnText}
          </Button>
          {/* <TouchableOpacity onPress={() => this.start()}>
            <Text style={{ fontSize: 18, marginBottom: 15, color: 'blue' }}> Start </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.stop()}>
            <Text style={{ fontSize: 18, marginBottom: 15, color: 'blue' }}> Stop </Text>
          </TouchableOpacity>
          */}
        </View>
      </View>
    );
  }
}

export default CameraBrightness;
