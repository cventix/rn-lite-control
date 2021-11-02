//
// File: components/SectionHeading.js
//
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from 'react-native-vector-icons';
import { Title, Text, Divider, withTheme, Button, Subheading } from 'react-native-paper';

import Constants from '../utils/constants';

const styles = StyleSheet.create({
  container: {},
  content: {
    minHeight: 40,
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  left: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
  },

  title: {
    fontWeight: 'normal',
    marginBottom: 0,
    color: '#fff',
    fontSize: 16,
    // marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 0,
    opacity: 0.8,
    color: '#fff',
  },
  counter: {
    color: '#fff',
    marginLeft: 5,
    marginRight: 10,
    opacity: 0.8,
  },
  icon: {
    color: '#fff',
    backgroundColor: 'transparent',
    opacity: 0.8,
  },
  buttonContainer: {},
  button: {
    // marginVertical: 10,
    marginLeft: -15,
    borderRadius: 10,
  },
});

const SectionHeader = ({
  title,
  subTitle,
  devices = 0,
  zones = 0,
  switches = 0,
  onAddNew,
  addNewText,
  theme,
}) => (
  <View style={([styles.container], { backgroundColor: theme.colors.primary })}>
    <View style={styles.content}>
      <View style={styles.left}>
        <Title style={[styles.title]} numberOfLines={1}>
          {title}
        </Title>
        {subTitle && <Subheading style={styles.subtitle}>{subTitle}</Subheading>}
        {onAddNew && (
          <View style={styles.buttonContainer}>
            <Button style={styles.button} color={theme.colors.accent} onPress={onAddNew}>
              {addNewText}
            </Button>
          </View>
        )}
      </View>
      <View style={styles.right}>
        <View style={styles.row}>
          {devices !== null && (
            <View style={styles.row}>
              <Icon style={styles.icon} name={Constants.ICON.device} size={18} />
              <Text style={styles.counter}>{devices}</Text>
            </View>
          )}

          {zones !== null && (
            <View style={styles.row}>
              <Icon style={styles.icon} name={Constants.ICON.zone} size={18} />
              <Text style={styles.counter}>{zones}</Text>
            </View>
          )}

          {/* Switches commented out until we implement */}
          {false &&
            switches !== null && (
              <View style={styles.row}>
                <Icon style={styles.icon} name={Constants.ICON.switch} size={18} />
                <Text style={styles.counter}>{switches}</Text>
              </View>
            )}
        </View>
      </View>
    </View>

    <Divider />
  </View>
);

export default withTheme(SectionHeader);
