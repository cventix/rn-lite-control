//
// File: components/AnimatedProgressCircle.js
//
import React, { Component } from 'react';
import { Animated } from 'react-native';
import CircleProgress from './CircleProgress';

const AnimatedProgress = Animated.createAnimatedComponent(CircleProgress);

export default class AnimatedProgressCircle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      percentAnimation: new Animated.Value(props.percent || 0),
    };
  }

  componentDidMount() {
    this.animatePercent();
  }

  componentDidUpdate(prevProps) {
    if (this.props.percent !== prevProps.percent) {
      this.animatePercent();
    }
  }

  animatePercent() {
    Animated.spring(this.state.percentAnimation, {
      toValue: this.props.percent,
      tension: 7,
      friction: 10,
      useNativeDriver: true
    }).start();
  }

  render() {
    return <AnimatedProgress percent={this.state.percentAnimation} {...this.props} />;
  }
}
