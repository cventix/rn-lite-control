//
// File: components/SignalIcon.js
//
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from 'react-native-vector-icons';

import Constants from '../utils/constants';

const styles = StyleSheet.create({
  iconCircle: {
    width: 72 - 16 * 2,
    height: 72 - 16 * 2,
    borderRadius: (72 - 16 * 2) / 2,
    backgroundColor: '#aaa',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
});

const SignalIcon = ({
  size, strength, color, bgColor,
}) => {
  const opacity = Math.round(strength / 100 * 10) / 10; // Opacity should be rounded to nearest .1

  return (
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
      <Icon size={size} name={Constants.ICON.signal} style={{ opacity, color }} />
    </View>
  );
};

export default SignalIcon;
