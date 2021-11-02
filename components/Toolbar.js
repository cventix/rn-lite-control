//
// File: components/Toolbar.js
//
import React from 'react';
// import { Toolbar, ToolbarBackAction, ToolbarAction, ToolbarContent } from 'react-native-paper';
import { Appbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import Constants from '../utils/constants';
import constants from '../utils/constants';

const MyToolbar = ({
  onBackPress,
  title,
  onDrawerPress,
  onSearchPress,
  onModalClose,
  onSettingsPress,
  onSave,
  saveDisabled,
}) => (
  <Appbar dark style={styles.appbar}>
    {onDrawerPress && (
      <Appbar.Action icon={Constants.ICON.drawer} onPress={() => onDrawerPress()} />
    )}
    {onBackPress && <Appbar.BackAction onPress={() => onBackPress()} />}
    <Appbar.Content
      // titleStyle={{ color: theme.colors.secondaryText }}
      // subtitleStyle={{ color: theme.colors.text }}
      title={Constants.APP_NAME}
      subtitle={title}
    />

    {onSearchPress && <Appbar.Action icon="search" onPress={() => onSearchPress()} />}

    {onSettingsPress && (
      <Appbar.Action icon={Constants.ICON.subSettings} onPress={() => onSettingsPress()} />
    )}

    {onModalClose && <Appbar.Action icon="close" onPress={() => onModalClose()} />}

    {onSave && !saveDisabled && <Appbar.Action icon="check" onPress={() => onSave()} />}
  </Appbar>
);

const styles = StyleSheet.create({
  appbar: {
    height: constants.IS_IPHONEX ? 100 : 90,
    paddingTop: constants.IS_IPHONEX ? 30 : 0
  }
})

export default MyToolbar;
