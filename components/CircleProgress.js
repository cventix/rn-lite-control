import React, { Component } from 'react';
import { Text } from 'react-native';
import ProgressCircle from 'react-native-progress-circle';

export default class CircleProgress extends Component {
  render() {
    const { percent, text, subtext } = this.props;
    return (
      <ProgressCircle percent={percent} {...this.props}>
        <Text style={{ fontSize: 18 }}>{text}</Text>
        {subtext && <Text style={{ fontSize: 16 }}>{subtext}</Text>}
      </ProgressCircle>
    );
  }
}
