//
// File: screens/Auth/AuthScreen.js
//
import React, { Component } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  Text,
  KeyboardAvoidingView,
} from 'react-native';
import { Image, View } from 'react-native-animatable';
import PropTypes from 'prop-types';

import imgLogo from '../../assets/images/logoPositive.png';
import metrics from '../../config/metrics';

import Opening from './Opening';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import MFAForm from './MFAForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const IMAGE_WIDTH = metrics.DEVICE_WIDTH * 0.8;

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental(true);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
    backgroundColor: 'white',
  },
  logoImg: {
    flex: 1,
    height: null,
    width: IMAGE_WIDTH,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginTop: 20,
    marginBottom: 0,
  },
  bottom: {
    // backgroundColor: '#1976D2'
    backgroundColor: '#363159',
  },
  mainError: {
    color: '#ff0033',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  error: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    paddingTop: 20,
    marginLeft: 20,
    marginRight: 20,
  },
});

export default class AuthView extends Component {
  static propTypes = {
    isLoggedIn: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    signup: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
    mfaCode: PropTypes.func.isRequired,
    forgotPassword: PropTypes.func.isRequired,
    forgotPasswordMFACode: PropTypes.func.isRequired,
    onLoginAnimationCompleted: PropTypes.func.isRequired, // Called at the end of a succesfull login/signup animation
    setVisibleForm: PropTypes.func.isRequired,
  };

  componentWillUpdate(nextProps) {
    // If the user has logged/signed up succesfully start the hide animation
    if (!this.props.isLoggedIn && nextProps.isLoggedIn) {
      this._hideAuthScreen();
    }
  }

  _hideAuthScreen = async () => {
    // 1. Slide out the form container
    await this._setVisibleForm(null);
    // 2. Fade out the logo
    await this.logoImgRef.fadeOut(800);
    // 3. Tell the container (app.js) that the animation has completed
    this.props.onLoginAnimationCompleted();
  };

  _setVisibleForm = async (visibleForm) => {
    // 1. Hide the current form (if any)
    if (this.props.visibleForm && this.formRef && this.formRef.hideForm) {
      await this.formRef.hideForm();
    }
    // 2. Configure a spring animation for the next step
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    // 3. Set the new visible form
    this.props.setVisibleForm(visibleForm);
  };

  render() {
    const {
      isLoggedIn,
      isLoading,
      signup,
      login,
      oAuthGoogle,
      oAuthFacebook,
      oAuthApple,
      isGooglePressed,
      isFacebookPressed,
      isApplePressed,
      mfaCode,
      forgotPassword,
      forgotPasswordMFACode,
      visibleForm,
    } = this.props;

    // The following style is responsible of the "bounce-up from bottom" animation of the form
    const formStyle = !visibleForm ? { height: 0 } : { marginTop: 10 };
    const keyboardOffSet = Platform.OS === 'ios' ? 40 : 0;

    return (
      <View style={styles.container}>
        <Image
          animation="bounceIn"
          duration={1200}
          delay={200}
          ref={ref => (this.logoImgRef = ref)}
          style={styles.logoImg}
          source={imgLogo}
        />
        {!visibleForm &&
          !isLoggedIn && (
            <View style={styles.container}>
              {!!this.props.errorMsg && <Text style={styles.mainError}>{this.props.errorMsg}</Text>}
              <Opening
                onCreateAccountPress={() => this._setVisibleForm('SIGNUP')}
                onSignInPress={() => this._setVisibleForm('LOGIN')}
                oAuthGoogle={oAuthGoogle}
                oAuthFacebook={oAuthFacebook}
                oAuthApple={oAuthApple}
                isLoadingGoogle={isLoading && isGooglePressed}
                isLoadingFacebook={isLoading && isFacebookPressed}
                isLoadingApple={isLoading && isApplePressed}
              />
            </View>
          )}
        <KeyboardAvoidingView
          keyboardVerticalOffset={keyboardOffSet}
          behavior="padding"
          style={[formStyle, styles.bottom]}
        >
          <View style={[formStyle, styles.bottom]}>
            {!!this.props.errorMsg && <Text style={styles.error}>{this.props.errorMsg}</Text>}
            {visibleForm === 'SIGNUP' && (
              <SignupForm
                ref={ref => (this.formRef = ref)}
                onLoginLinkPress={() => this._setVisibleForm(null)}
                onMFACodeLinkPress={() => this._setVisibleForm('MFA')}
                onSignupPress={signup}
                isLoading={isLoading}
              />
            )}
            {visibleForm === 'LOGIN' && (
              <LoginForm
                ref={ref => (this.formRef = ref)}
                onSignupLinkPress={() => this._setVisibleForm(null)}
                onForgotPasswordLinkPress={() => this._setVisibleForm('FORGOTPASSWORD')}
                onLoginPress={login}
                isLoading={isLoading}
                {...this.props}
              />
            )}
            {visibleForm === 'MFA' && (
              <MFAForm
                ref={ref => (this.formRef = ref)}
                onBackLinkPress={() => this._setVisibleForm('SIGNUP')}
                onMFACodePress={mfaCode}
                isLoading={isLoading}
                btnText="Login"
                {...this.props}
              />
            )}
            {visibleForm === 'FORGOTPASSWORD' && (
              <ForgotPasswordForm
                ref={ref => (this.formRef = ref)}
                onBackLinkPress={() => this._setVisibleForm('LOGIN')}
                onMFACodeLinkPress={() => this._setVisibleForm('FORGOTPASSWORDMFA')}
                onForgotPasswordPress={forgotPassword}
                isLoading={isLoading}
                {...this.props}
              />
            )}
            {visibleForm === 'FORGOTPASSWORDMFA' && (
              <MFAForm
                ref={ref => (this.formRef = ref)}
                onBackLinkPress={() => this._setVisibleForm('FORGOTPASSWORD')}
                onMFACodePress={forgotPasswordMFACode}
                isLoading={isLoading}
                btnText="Reset Password"
                {...this.props}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}
