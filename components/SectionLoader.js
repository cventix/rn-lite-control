//
// File: components/SectionHeading.js
//
import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

import theme from '../utils/theme';

const styles = StyleSheet.create({
  middle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  text: {
    color: theme.colors.secondaryText,
  },
  textLight: {
    color: theme.colors.textLight,
  },
});

const SectionLoader = ({ title, isLight }) => {
  const { colors } = theme;
  const textStyle = isLight ? styles.textLight : styles.text;
  return (
    <View style={styles.middle}>
      <Text allowFontScaling={false} style={[styles.title, textStyle]}>
        {title}
      </Text>
      <ActivityIndicator size="small" color={isLight ? colors.textLight : colors.accent} />
    </View>
  );
};

export default SectionLoader;
