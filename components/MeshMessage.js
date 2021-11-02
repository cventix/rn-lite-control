//
// File: components/MeshMessage.js
//

import React from 'react';
import { Text } from 'react-native';
import { Snackbar } from 'react-native-paper';

class MeshMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: props.visible,
      msg: props.msg,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.msg && prevProps.msg !== this.props.msg) {
      this.setState({ msg: this.props.msg, visible: true });
    }
  }

  onDismiss = () => {
    this.setState(prevState => ({ visible: false }));
  };

  onClose = () => {
    this.setState(prevState => ({ visible: false }));
  };

  render() {
    const { msg, visible } = this.state;
    if (!msg) return null;

    return (
      <Snackbar
        visible={visible}
        onDismiss={this.onDismiss}
        // action={{
        //   label: 'Close',
        //   onPress: this.onClose,
        // }}
      >
        <Text>{msg}</Text>
      </Snackbar>
    );
  }
}

export default MeshMessage;
