//
// File: screens/Swtiches/SwitchScreen.js
//
import React from 'react';
import { View } from 'react-native';
import { Subheading } from 'react-native-paper';

import appStyles from '../styles';

class ReportScreen extends React.Component {
  static title = 'Reports';

  render() {
    return (
      <View style={appStyles.container}>
        <View style={appStyles.content}>
          <Subheading>No reports yet</Subheading>
        </View>
      </View>
    );
  }
}

export default ReportScreen;
