//
// File: screens/Auth/SignupForm.js
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
  createAccountButton: {
    backgroundColor: 'white',
  },
  createAccountButtonText: {
    color: '#3E464D',
    fontWeight: 'bold',
  },
  loginLink: {
    color: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
    padding: 20,
  },
});

export default class SignupForm extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    onSignupPress: PropTypes.func.isRequired,
    onLoginLinkPress: PropTypes.func.isRequired,
    onMFACodeLinkPress: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    password: '',
    username: '',
    phone: '',
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
    const {
      email, password, username, phone,
    } = this.state;
    const {
      isLoading, onLoginLinkPress, onSignupPress, onMFACodeLinkPress,
    } = this.props;
    const isValid = email !== '' && password !== ''; // && username !== '' && phone !== '';
    return (
      <View style={styles.container}>
        <View style={styles.form} ref={ref => (this.formRef = ref)}>
          {/* <CustomTextInput
            ref={ref => (this.usernameInputRef = ref)}
            autoCapitalize="none"
            placeholder="Enter your Username"
            editable={!isLoading}
            returnKeyType="next"
            blurOnSubmit={false}
            withRef
            onSubmitEditing={() => this.passwordInputRef.focus()}
            onChangeText={value => this.setState({ username: value })}
            isEnabled={!isLoading}
          /> */}
          <CustomTextInput
            name="email"
            ref={ref => (this.emailInputRef = ref)}
            autoCapitalize="none"
            placeholder="Enter your email address"
            keyboardType="email-address"
            editable={!isLoading}
            returnKeyType="next"
            blurOnSubmit={false}
            withRef
            onSubmitEditing={() => this.passwordInputRef.focus()}
            onChangeText={value => this.setState({ email: value.trim() })}
            isEnabled={!isLoading}
            value={this.state.email}
          />
          <CustomTextInput
            name="password"
            ref={ref => (this.passwordInputRef = ref)}
            autoCapitalize="none"
            placeholder="Enter your password"
            editable={!isLoading}
            returnKeyType="done"
            secureTextEntry
            withRef
            onChangeText={value => this.setState({ password: value.trim() })}
            isEnabled={!isLoading}
            value={this.state.password}
          />

          {/* <CustomTextInput
            ref={ref => (this.phoneInputRef = ref)}
            autoCapitalize="none"
            placeholder="Enter your Phone Number"
            keyboardType="phone-pad"
            editable={!isLoading}
            returnKeyType="done"
            blurOnSubmit={false}
            withRef
            onChangeText={value => this.setState({ phone: value })}
            isEnabled={!isLoading}
          /> */}
        </View>
        <View style={styles.footer}>
          <View ref={ref => (this.buttonRef = ref)} animation="bounceIn" duration={600} delay={400}>
            <CustomButton
              onPress={() => {
                onSignupPress(username, password, email, phone);
                // onSignupPress(username, password, email, phone).then((showMFA) => {
                //   if (showMFA) {
                //     onMFACodeLinkPress();
                //   }
                // });
              }}
              isEnabled={isValid}
              isLoading={isLoading}
              buttonStyle={styles.createAccountButton}
              textStyle={styles.createAccountButtonText}
              text="Create Account"
            />
          </View>
          <Text
            ref={ref => (this.linkRef = ref)}
            style={styles.loginLink}
            onPress={onLoginLinkPress}
            animation="fadeIn"
            duration={600}
            delay={400}
          >
            {'Already have an account?'}
          </Text>
        </View>
      </View>
    );
  }
}
