//
// File: screens/Auth/LoginForm.js
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
    // height: metrics.DEVICE_HEIGHT * 40 / 100
  },
  form: {
    marginTop: 20,
  },
  footer: {
    // height: 100,
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
    padding: 10,
  },
});

export default class LoginForm extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    onLoginPress: PropTypes.func.isRequired,
    onSignupLinkPress: PropTypes.func.isRequired,
    onForgotPasswordLinkPress: PropTypes.func.isRequired,
  };

  state = {
    username: '',
    password: '',
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
    const { username, password } = this.state;
    const {
      isLoading, onSignupLinkPress, onLoginPress, onForgotPasswordLinkPress,
    } = this.props;
    const isValid = username !== '' && password !== '';
    return (
      <View style={styles.container}>
        <View
          style={styles.form}
          ref={(ref) => {
            this.formRef = ref;
          }}
        >
          <CustomTextInput
            name="username"
            ref={ref => (this.usernameInputRef = ref)}
            placeholder="Enter your email address"
            keyboardType="email-address"
            editable={!isLoading}
            returnKeyType="next"
            blurOnSubmit={false}
            withRef
            onSubmitEditing={() => this.passwordInputRef.focus()}
            onChangeText={value => this.setState({ username: value.trim() })}
            isEnabled={!isLoading}
            value={this.state.username}
          />
          <CustomTextInput
            name="password"
            ref={ref => (this.passwordInputRef = ref)}
            autoCapitalize="none"
            placeholder="Enter your Password"
            editable={!isLoading}
            returnKeyType="done"
            secureTextEntry
            withRef
            onChangeText={value => this.setState({ password: value.trim() })}
            isEnabled={!isLoading}
            value={this.state.password}
          />
        </View>
        <View style={styles.footer}>
          <View ref={ref => (this.buttonRef = ref)} animation="bounceIn" duration={600} delay={400}>
            <CustomButton
              onPress={() => onLoginPress(username, password)}
              isEnabled={isValid}
              isLoading={isLoading}
              buttonStyle={styles.loginButton}
              textStyle={styles.loginButtonText}
              text="Log In"
            />
          </View>
          <Text
            ref={ref => (this.linkRef = ref)}
            style={styles.signupLink}
            onPress={onForgotPasswordLinkPress}
            animation="fadeIn"
            duration={600}
            delay={400}
          >
            {'Forgot Password?'}
          </Text>
          <Text
            ref={ref => (this.linkRef = ref)}
            style={styles.signupLink}
            onPress={onSignupLinkPress}
            animation="fadeIn"
            duration={600}
            delay={400}
          >
            {'Not registered yet?'}
          </Text>
        </View>
      </View>
    );
  }
}
