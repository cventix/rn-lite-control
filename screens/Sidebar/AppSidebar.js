//
// File: screens/Sidebar/AppSidebar.js
//
import React from 'react';
import { Image, View, FlatList, ScrollView } from 'react-native';
import { Text, withTheme, TouchableRipple } from 'react-native-paper';
import { withNavigation } from 'react-navigation';
import { DrawerActions } from 'react-navigation-drawer';
import * as WebBrowser from 'expo-web-browser'
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from 'react-native-vector-icons';
import Constants from '../../utils/constants';
import styles from './styles';

import firebase from '../../config/firebase';

const drawerCover = require('../../assets/images/logo.png');
// const drawerImage = require("../../../assets/logo-kitchen-sink.png");

//
// Need own DrawerItem as the react-native-paper one color attribute does not work.
//
const DrawerItem = ({
  icon, iconColor, label, labelColor, onPress, fontFamily,
}) => {
  const labelMargin = icon ? 15 : 0;

  return (
    <TouchableRipple onPress={onPress}>
      <View style={styles.wrapper}>
        {icon && <Icon name={icon} size={24} color={iconColor} />}
        <Text
          numberOfLines={1}
          style={{
            color: labelColor,
            ...fontFamily,
            marginLeft: labelMargin,
            marginRight: 15,
          }}
        >
          {label}
        </Text>
      </View>
    </TouchableRipple>
  );
};

class AppSidebar extends React.Component {
  static navigationOptions = {
    header: {
      visible: false,
    },
  };

  state = {
    user: null,
  };

  componentDidMount() {
    this.setState({ user: firebase.auth().currentUser });
  }

  closeDrawer() {
    this.props.navigation.dispatch(DrawerActions.closeDrawer());
  }

  render() {
    const { drawerItems, theme, navigation } = this.props;
    const { user } = this.state;
    const { colors } = theme;
    const iconColor = colors.textLight;
    const labelColor = colors.textLight;
    const fontFamily = theme.fonts.medium;

    let isDebug = false;
    let userLabel = 'Loading...';
    if (user) {
      // DisplayName will exist if login via oAuth provider.
      userLabel = user.displayName ? user.displayName : user.email;
      isDebug = user.debug;
    }

    return (
      <LinearGradient
        style={[styles.container]}
        colors={[colors.accent, colors.primary]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0.1, y: 1 }}
      >
        <View style={styles.drawerCover}>
          <Image source={drawerCover} style={styles.coverImage} />
        </View>

        <ScrollView style={styles.container}>
          <View style={styles.drawerSection}>
            <DrawerItem
              onPress={() => {
                navigation.navigate('Account');
                this.closeDrawer();
              }}
              icon={Constants.ICON.account}
              iconColor={iconColor}
              label={userLabel}
              labelColor={labelColor}
              fontFamily={fontFamily}
            />
          </View>
          <View style={styles.drawerSection}>
            <FlatList
              data={drawerItems}
              renderItem={({ item }) => (
                <DrawerItem
                  onPress={() => {
                    if (/^https?:/gi.test(item.route)) {
                      WebBrowser.openBrowserAsync(item.route);
                    } else {
                      navigation.navigate(item.route);
                    }
                    this.closeDrawer();
                  }}
                  icon={item.icon}
                  iconColor={iconColor}
                  label={item.key}
                  labelColor={labelColor}
                  fontFamily={fontFamily}
                />
              )}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.disabled}>
            Version {Constants.VERSION} {isDebug && ' (D)'}
          </Text>
        </View>
      </LinearGradient>
    );
  }
}

export default withTheme(withNavigation(AppSidebar));
