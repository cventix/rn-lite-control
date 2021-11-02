//
// File: Main.js
//
import React, { Component } from 'react';
import { StatusBar, LogBox, Text, TextInput, KeyboardAvoidingView, AppState } from 'react-native';
import { connect } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import _ from 'lodash';

import { actionTypes } from './reducers';
import NavigatorService from './services/navigator';
import firebase from './config/firebase';
import theme from './utils/theme';
import LOG from './utils/LOG';
import AppNavigator from './router';
import LocalStorage from './lib/Categories/LocalStorage';
// import bleApi from './sagas/deviceBleApi';

@connect()
export default class Main extends Component {
  state = {
    appState: AppState.currentState,
  };

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    StatusBar.setBarStyle('light-content');

    // Temporary fix for firebase setting a large timeout,
    // which causes react-native to warn about performance implications.
    LogBox.ignoreLogs(['Setting a timer']);
    const _console = _.clone(console);
    console.warn = (message) => {
      if (message.indexOf('Setting a timer') <= -1) {
        _console.warn(message);
      }
    };

    // Disabling font scaling on text elements will fix layout
    // issues for devices that have their accessibility font scaling
    // turned right up.
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.allowFontScaling = false;
    TextInput.defaultProps.allowFontScaling = false;

    LocalStorage.init();

    this.listen();
  }

  //
  // Don't forget to stop listening for authentication state changes
  // when the component unmounts.
  //
  componentWillUnmount() {
    LOG.console('Unmounting app');
    this.authSubscription && this.authSubscription();
  }

  listen() {
    // When the App component mounts, we listen for any authentication
    // state changes in Firebase.
    // Once subscribed, the 'user' parameter will either be null
    // (logged out) or an Object (logged in)
    this.authSubscription = firebase.auth().onIdTokenChanged((user) => {
      // If facebook login and they do not share Email address in their profile settings,
      // then email will be null so we want to allow them to login as they are effectively verified anyway.
      if (user && (!user.email || user.emailVerified)) {
        // Update any user details in the database.
        this.props.dispatch({
          type: actionTypes.auth.SET_USER,
          user,
          userSet: true,
        });
        this.props.dispatch({ type: actionTypes.auth.SAVE_USER, user });
        // Look up the phone and save it if it doesn't already exist in the database.
        this.props.dispatch({ type: actionTypes.phone.GET_PHONE });
      } else {
        this.props.dispatch({
          type: actionTypes.auth.SET_USER,
          user: null,
          userSet: true,
        });
      }
    });
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/active/)) {
      if (nextAppState === 'background') {
        // disable listeners.
        this.authSubscription();
        // Don't do this.
        // bleApi.stopDeviceManager();
      }
    }

    // This won't be true the first time the app starts.
    if (this.state.appState.match(/inactive|background/)) {
      if (nextAppState === 'active') {
        // Enable listeners again.
        this.listen();
        // ble listeners will be re-enabled the next time they are required.
      }
    }
    this.setState({ appState: nextAppState });
  };

  render() {
    return (
      <PaperProvider theme={theme}>
        <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
          <AppNavigator
            ref={(navigatorRef) => {
              NavigatorService.setContainer(navigatorRef);
            }}
          />
        </KeyboardAvoidingView>
      </PaperProvider>
    );
  }
}
