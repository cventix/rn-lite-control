//
// File: components/AccordianCard.js
//

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

const styles = StyleSheet.create({
  content: {
    margin: 10,
  },
});

class AccordianCard extends React.Component {
  render() {
    const {
      children, title, description, icon,
    } = this.props;

    return (
      <List.Accordion icon={icon} title={title} description={description}>
        <View style={styles.content}>{children}</View>
      </List.Accordion>
    );
  }
}

export default AccordianCard;
