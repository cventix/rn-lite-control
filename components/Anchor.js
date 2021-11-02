//
// File: components/Anchor.js
//
import React from 'react';
import { Linking, Text } from 'react-native';

class Anchor extends React.Component {
  handlePress = () => {
    Linking.openURL(this.props.href);
    this.props.onPress && this.props.onPress();
  };

  render() {
    return (
      <Text style={{ textDecorationLine: 'underline' }} {...this.props} onPress={this.handlePress}>
        {this.props.children}
      </Text>
    );
  }
}

export default Anchor;
