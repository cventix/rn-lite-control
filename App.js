//
// File: App.js
//
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import * as Sentry from 'sentry-expo';
import codePush from "react-native-code-push";
import store from './store';
import Main from './Main';

// import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://bd61694f6f5e4deab29416e023ff5ee9@o491979.ingest.sentry.io/5558479',
  // enableNative: false,
  enableInExpoDevelopment: true,
  debug: true,
});


// eslint-disable-next-line react/prefer-stateless-function
class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <StatusBar style="light" />
        <Main />
      </Provider>
    );
  }
}

let codePushOptions = { checkFrequency: codePush.CheckFrequency.MANUAL };

export default codePush(codePushOptions)(App)