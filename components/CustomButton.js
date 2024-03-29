//
// File: components/CustomButton.js
//
import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { View } from 'react-native-animatable';
import PropTypes from 'prop-types';

import TouchableView from './TouchableView';

const CustomButton = ({
  onPress,
  isEnabled,
  isLoading,
  text,
  buttonStyle,
  textStyle,
  icon,
  ...otherProps
}) => {
  const onButtonPress = isEnabled && !isLoading ? onPress : () => null;

  return (
    <View {...otherProps}>
      <TouchableView onPress={onButtonPress} style={[styles.button, buttonStyle]}>
        {isLoading && <ActivityIndicator style={styles.spinner} color="grey" />}
        {icon && <View style={styles.icon}>{icon}</View>}
        {!isLoading && <Text style={[styles.text, textStyle]}>{text}</Text>}
      </TouchableView>
    </View>
  );
};

CustomButton.propTypes = {
  onPress: PropTypes.func,
  isEnabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  text: PropTypes.string,
  buttonStyle: PropTypes.any,
  textStyle: PropTypes.any,
  icon: PropTypes.any,
};

CustomButton.defaultProps = {
  onPress: () => null,
  isEnabled: true,
  isLoading: false,
};

const styles = StyleSheet.create({
  button: {
    height: 42,
    borderWidth: 1,
    borderRadius: 3,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  spinner: {
    height: 26,
  },
  text: {
    textAlign: 'center',
    fontWeight: '700',
    color: 'white',
  },
  icon: {
    position: 'absolute',
    left: 10,
    top: 8,
  },
});

export default CustomButton;
