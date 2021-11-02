//
// File: components/Settings/SettingSwitch.js
//
import React from 'react';
import { Switch } from 'react-native-paper';

class SettingSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value !== undefined ? props.value : false,
    };
  }

  onSave = (value) => {
    this.setState({ value });
    this.props.onSave(value);
  };

  componendDidMount() {
    if (this.props.value) {
      this.setState(this.props.value);
    }
  }

  render() {
    return <Switch value={this.state.value} onValueChange={this.onSave} />;
  }
}

export default SettingSwitch;
