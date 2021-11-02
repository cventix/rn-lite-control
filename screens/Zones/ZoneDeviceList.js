import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import CircleIcon from '../../components/CircleIcon';
import CardList from '../../components/CardList';
import Constants from '../../utils/constants';
// import datetime from '../../utils/datetime';

const ZoneDeviceList = (props) => {
  const {
    zoneDevices,
    onZoneDevicePress,
    onZoneDeviceSwitchChange,
    onRemoveFromZone,
    onDisconnect,
    theme,
    itemTitlePrefix,
    itemTitlePostfix,
  } = props;
  if (zoneDevices.length === 0) {
    return (
      <View style={{ margin: 10 }}>
        <Text>Search for available lights and add them to the zone.</Text>
        <Text>Calibrate each light to maximise your energy savings.</Text>
        <Text>All lights must be in a zone.</Text>
      </View>
    );
  }

  return (
    <CardList
      items={zoneDevices}
      theme={theme}
      itemDetailTemplate={(item) => {
        const text = [];
        if (item.connected) text.push('Connected');
        if (item.calibrated) {
          text.push('Calibrated');
        } else {
          text.push('Not Calibrated');
        }
        return text.join(' and ');
      }}
      itemTitlePrefix={itemTitlePrefix}
      itemTitlePostfix={itemTitlePostfix}
      actions={(item) => {
        const actions = [
          {
            text: 'Flash',
            onPress: onZoneDeviceSwitchChange,
          },
          {
            text: 'Select',
            onPress: onZoneDevicePress,
            primary: true,
          },
          {
            text: 'Remove',
            onPress: onRemoveFromZone,
          },
        ];

        if (item.connected) {
          actions.push({
            text: 'Disconnect',
            onPress: onDisconnect,
          });
        }

        return actions;
      }}
      icon={(item) => {
        let iconColor = theme.colors.accent2;
        if (item.calibrated) {
          iconColor = theme.colors.accent;
        }
        return (
          <CircleIcon size={24} name={Constants.ICON.device} color="#fff" bgColor={iconColor} />
        );
      }}
    />
  );
};

export default ZoneDeviceList;
