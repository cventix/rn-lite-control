//
// File: screens/Auth/MFAForm.js
//
import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from 'react-native-animatable';
import PropTypes from 'prop-types';

import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import metrics from '../../config/metrics';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: metrics.DEVICE_WIDTH * 0.1,
  },
  form: {
    marginTop: 20,
  },
  footer: {
    height: 100,
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: 'white',
  },
  loginButtonText: {
    color: '#3E464D',
    fontWeight: 'bold',
  },
  signupLink: {
    color: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
    padding: 20,
  },
});

export default class LoginForm extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    onMFACodePress: PropTypes.func.isRequired,
    onBackLinkPress: PropTypes.func.isRequired,
    btnText: PropTypes.string.isRequired,
  };

  state = {
    mfacode: '',
  };

  hideForm = async () => {
    if (this.buttonRef && this.formRef && this.linkRef) {
      await Promise.all([
        this.buttonRef.zoomOut(200),
        this.formRef.fadeOut(300),
        this.linkRef.fadeOut(300),
      ]);
    }
  };

  render() {
    const { mfacode } = this.state;
    const {
      isLoading, onBackLinkPress, onMFACodePress, btnText,
    } = this.props;
    const isValid = mfacode !== '';
    return (
      <View style={styles.container}>
        <View
          style={styles.form}
          ref={(ref) => {
            this.formRef = ref;
          }}
        >
          <CustomTextInput
            name="mfacode"
            ref={ref => (this.mfacodeInputRef = ref)}
            placeholder="Enter Code"
            keyboardType="numeric"
            editable={!isLoading}
            returnKeyType="go"
            blurOnSubmit={false}
            withRef
            onChangeText={value => this.setState({ mfacode: value })}
            isEnabled={!isLoading}
          />
        </View>
        <View style={styles.footer}>
          <View ref={ref => (this.buttonRef = ref)} animation="bounceIn" duration={600} delay={400}>
            <CustomButton
              onPress={() => onMFACodePress(mfacode)}
              isEnabled={isValid}
              isLoading={isLoading}
              buttonStyle={styles.loginButton}
              textStyle={styles.loginButtonText}
              text={btnText}
            />
          </View>
          <Text
            ref={ref => (this.linkRef = ref)}
            style={styles.signupLink}
            onPress={onBackLinkPress}
            animation="fadeIn"
            duration={600}
            delay={400}
          >
            {'Back'}
          </Text>
        </View>
      </View>
    );
  }
}
