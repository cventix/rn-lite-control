//
// File: components/CapitalisedText.js
//
import React from 'react';
import { Text } from 'react-native';

const CapitalisedText = (props) => {
  const text =
    props.children.slice(0, 1).toUpperCase() + props.children.slice(1, props.children.length);

  return <Text {...props}>{text}</Text>;
};

export default CapitalisedText;
