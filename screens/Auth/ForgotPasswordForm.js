//
// File: screens/Auth/ForgotPasswordForm.js
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

export default class ForgotPasswordForm extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    onForgotPasswordPress: PropTypes.func.isRequired,
    onBackLinkPress: PropTypes.func.isRequired,
    onMFACodeLinkPress: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    // username: '',
    // newpassword: '',
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
    // const { username, newpassword } = this.state;
    const { email } = this.state;
    const {
      isLoading, onBackLinkPress, onForgotPasswordPress, onMFACodeLinkPress,
    } = this.props;
    // const isValid = username !== '' && newpassword !== '';
    const isValid = email !== '';
    return (
      <View style={styles.container}>
        <View
          style={styles.form}
          ref={(ref) => {
            this.formRef = ref;
          }}
        >
          <CustomTextInput
            name="email"
            ref={ref => (this.usernameInputRef = ref)}
            placeholder="Please enter your Email address"
            keyboardType="email-address"
            editable={!isLoading}
            returnKeyType="done"
            // blurOnSubmit={false}
            withRef
            onChangeText={value => this.setState({ email: value.trim() })}
            isEnabled={!isLoading}
            value={this.state.email}
          />
          {/* <CustomTextInput
            name="username"
            ref={ref => (this.usernameInputRef = ref)}
            placeholder="Please enter your username"
            editable={!isLoading}
            returnKeyType="next"
            blurOnSubmit={false}
            withRef
            onChangeText={value => this.setState({ username: value })}
            isEnabled={!isLoading}
          />
          <CustomTextInput
            name="newpassword"
            ref={ref => (this.usernameInputRef = ref)}
            placeholder="Please enter your new password"
            editable={!isLoading}
            returnKeyType="done"
            blurOnSubmit={false}
            withRef
            secureTextEntry
            onChangeText={value => this.setState({ newpassword: value })}
            isEnabled={!isLoading}
          /> */}
        </View>
        <View style={styles.footer}>
          <View ref={ref => (this.buttonRef = ref)} animation="bounceIn" duration={600} delay={400}>
            <CustomButton
              onPress={() => {
                // onForgotPasswordPress(username, newpassword).then((showMFA) => {
                //   if (showMFA) {
                //     onMFACodeLinkPress();
                //   }
                // });
                onForgotPasswordPress(email);
              }}
              isEnabled={isValid}
              isLoading={isLoading}
              buttonStyle={styles.loginButton}
              textStyle={styles.loginButtonText}
              text="Reset Password"
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
            {'Cancel'}
          </Text>
        </View>
      </View>
    );
  }
}
