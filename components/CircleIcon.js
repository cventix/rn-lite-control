//
// File: components/CapitalisedText.js
//
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from 'react-native-vector-icons';

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

const CircleIcon = props => (
  <View style={[styles.iconCircle, { backgroundColor: props.bgColor }]}>
    <Icon {...props} />
  </View>
);

export default CircleIcon;
