//
// File: screens/Auth/index.js
//
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { connect } from 'react-redux';
import { SafeAreaView, View } from 'react-native';
import * as GoogleSignIn from 'expo-google-sign-in';
import AuthView from './AuthView';
import { actionTypes } from '../../reducers';
import styles from './styles';
import LOG from '../../utils/LOG';

@connect(store => ({
  username: store.auth.username,
  password: store.auth.password,
  loginStatus: store.auth.loginStatus,
  errorMessage: store.auth.errorMessage,
  isLoading: store.auth.isLoading,
  visibleForm: store.auth.visibleForm,
  isFirstLogin: store.auth.isFirstLogin,
}))
class AuthScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showMFAPrompt: false,
    };

    this.baseState = this.state;
  }

  componentDidMount() {
    this.initAsync();
  }

  initAsync = async () => {
    await GoogleSignIn.initAsync();
    this._syncUserWithStateAsync();
  };

  _syncUserWithStateAsync = async () => {
    await GoogleSignIn.signInSilentlyAsync();
  };

  doSetVisibleForm(visibleForm) {
    this.props.dispatch({
      type: actionTypes.auth.SET_VISIBLE_FORM,
      payload: visibleForm,
    });
  }

  doSignUp(username, password, email, phone) {
    this.props.dispatch({
      type: actionTypes.auth.DO_REGISTER,
      payload: { email, password },
    });
  }

  doLogin(username, password) {
    this.props.dispatch({
      type: actionTypes.auth.DO_LOGIN,
      payload: { username, password },
      isFirstLogin: this.props.isFirstLogin,
    });
  }

  oAuthGoogle = () => {
    this.props.dispatch({
      type: actionTypes.auth.DO_LOGIN_PROVIDER,
      provider: 'google',
    });
    this.setState(prevState => ({
      isGooglePressed: true,
      isFacebookPressed: false,
      isApplePressed: false,
    }));
  };

  oAuthFacebook = () => {
    this.props.dispatch({
      type: actionTypes.auth.DO_LOGIN_PROVIDER,
      provider: 'facebook',
    });
    this.setState(prevState => ({
      isFacebookPressed: true,
      isGooglePressed: false,
      isApplePressed: false,
    }));
  };

  oAuthApple = () => {
    this.props.dispatch({
      type: actionTypes.auth.DO_LOGIN_PROVIDER,
      provider: 'apple',
    });
    this.setState(prevState => ({
      isApplePressed: true,
      isGooglePressed: false,
      isFacebookPressed: false,
    }));
  };

  // TODO
  async doMFACode(code) {
    const { screenProps } = this.props;
    const { auth } = screenProps;
    let errorMessage = '';
    let isLoading = true;
    let session = null;

    try {
      await auth.confirmSignUp(this.state.username, code).then(data => {
        if (data.userConfirmed) {
          // LOG.console(data);
          auth.currentSession().then(s => (session = s));
        }
        // LOG.console('sign up successful ->', data);
      });

      screenProps.rootNavigator.navigate('LoggedIn');
    } catch (exception) {
      errorMessage = exception.message || exception;
    }
    isLoading = false;

    this.setState({
      session,
      errorMessage,
      isLoading,
    });
  }

  // TODO
  async doForgotPasswordMFACode(code) {
    const { screenProps } = this.props;
    const { auth } = screenProps;
    const { username, newpassword } = this.state;
    let errorMessage = '';
    let isLoading = true;
    const session = null;

    this.setState({
      errorMessage,
      isLoading,
    });

    try {
      await auth.forgotPasswordSubmit(username, code, newpassword);
      errorMessage = 'Password Reset';
      screenProps.rootNavigator.navigate('Auth');
    } catch (err) {
      errorMessage = err;
      LOG.console(err);
    }

    isLoading = false;

    this.setState({
      session,
      errorMessage,
      isLoading,
    });
  }

  doForgotPassword(email) {
    this.props.dispatch({
      type: actionTypes.auth.DO_RESET_PASSWORD,
      payload: { email },
    });
  }

  render() {
    return (
      <SafeAreaView style={styles.flexOne}>
        <StatusBar style="dark" />
        <AuthView
          login={(username, password) => this.doLogin(username, password)}
          oAuthGoogle={this.oAuthGoogle}
          isGooglePressed={this.state.isGooglePressed}
          oAuthFacebook={this.oAuthFacebook}
          isFacebookPressed={this.state.isFacebookPressed}
          oAuthApple={this.oAuthApple}
          isApplePressed={this.state.isApplePressed}
          errorMsg={this.props.errorMessage}
          signup={(username, password, email, phone) =>
            this.doSignUp(username, password, email, phone)
          }
          mfaCode={code => this.doMFACode(code)}
          forgotPasswordMFACode={code => this.doForgotPasswordMFACode(code)}
          forgotPassword={email => this.doForgotPassword(email)}
          isLoggedIn={false}
          isLoading={this.props.isLoading}
          onLoginAnimationCompleted={() => this.setState({ isAppReady: true })}
          visibleForm={this.props.visibleForm}
          setVisibleForm={visibleForm => {
            this.doSetVisibleForm(visibleForm);
          }}
        />

        {this.props.visibleForm && <View style={styles.fixBackground} />}
      </SafeAreaView>
    );
  }
}

export default props => {
  const { screenProps, ...otherProps } = props;
  return <AuthScreen screenProps={{ ...screenProps, ...otherProps }} />;
};
