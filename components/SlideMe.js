//
// File: components/SlideMe.js
//

import * as React from 'react';
import { StyleSheet, Slider, View, TextInput, Text } from 'react-native';
import { MaterialIcons as Icon } from 'react-native-vector-icons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  blockade: {
    justifyContent: 'center',
    width: 40,
  },
  slider: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginLeft: 10,
  },
  underline: {
    width: 30,
    height: 2,
    marginTop: 5,
  },
  right: {
    marginLeft: 10,
    alignItems: 'center',
  },
});

class SlideMe extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
    };
  }

  onValueChange = (val) => {
    // This will only be called by the slider.
    this.setState({ value: val });
    if (this.props.onValueChange) {
      this.props.onValueChange(Number(val));
    }
  };

  onSlidingComplete = (val) => {
    // This may be called by the slider or the TextInput so we need some validation.
    const min = Number(this.props.minimumValue);
    const max = Number(this.props.maximumValue);
    let myVal = Number(val);

    if (!myVal || myVal < min) {
      myVal = min;
    } else if (myVal > max) {
      myVal = max;
    }
    if (this.props.onSlidingComplete) {
      this.props.onSlidingComplete(myVal);
    }
    if (Number(val) !== myVal) {
      this.setState({ value: myVal });
    }
  };

  render() {
    const {
      icon, iconColor, highlight, minimumValue, minimumLabel,
    } = this.props;

    let minLabel = minimumLabel;
    if (minLabel === null || minLabel === undefined) {
      minLabel = minimumValue;
    }

    return (
      <View style={styles.container}>
        {icon && (
          <View style={styles.blockade}>
            <Icon size={24} name={icon} style={styles.icon} color={iconColor} />
          </View>
        )}

        {!icon && (
          <View style={styles.blockade}>
            <Text style={styles.text}>{minLabel}</Text>
          </View>
        )}

        <Slider
          {...this.props}
          style={styles.slider}
          onValueChange={this.onValueChange}
          onSlidingComplete={this.onSlidingComplete}
        />

        <View style={[styles.blockade, styles.right]}>
          {/* <Text style={styles.text}>{this.state.value}</Text> */}
          <TextInput
            value={`${this.state.value}`}
            onChangeText={val => this.setState({ value: val })}
            onSubmitEditing={() => this.onSlidingComplete(this.state.value)}
            keyboardType="numeric"
            underlineColorAndroid="#fff"
            returnKeyType="done"
          />
          <View
            style={[
              styles.underline,
              {
                backgroundColor: highlight,
              },
            ]}
          />
        </View>
      </View>
    );
  }
}

export default SlideMe;
