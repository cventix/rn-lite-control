import React from 'react';
import { View, ScrollView } from 'react-native';
import { Title, Paragraph, Card, CardContent, FAB } from 'react-native-paper';

import CircleIcon from '../../components/CircleIcon';
import CardList from '../../components/CardList';
import SignalIcon from '../../components/SignalIcon';
import Constants from '../../utils/constants';

import appStyles from '../styles';

const DiscoveredDevices = (props) => {
  const {
    discoveredDevices,
    onDiscoveredDevicePress,
    onDiscoveredDeviceSwitchChange,
    onRefresh,
    onDisconnect,
    discovering,
    onLoadDiscoveredDevices,
    hasDiscovered,
    theme,
    itemTitlePrefix,
  } = props;

  if (!hasDiscovered) {
    return (
      <View style={appStyles.flexOne}>
        <ScrollView>
          <Card elevation={0} style={{ margin: 0 }}>
            <Card.Content>
              <Title>Add Lights to Zone</Title>
              <Paragraph>Search for available lights and add them to the zone.</Paragraph>
              <Paragraph>Calibrate each light to maximise your energy savings.</Paragraph>
              <Paragraph>All lights must be in a zone.</Paragraph>
              <Paragraph>Once you have added a light, it will move to ZONED LIGHTS.</Paragraph>
            </Card.Content>
          </Card>
        </ScrollView>
        <View style={appStyles.fabContainer}>
          <FAB icon="plus" onPress={onLoadDiscoveredDevices} />
        </View>
      </View>
    );
  }

  return (
    <CardList
      items={discoveredDevices}
      theme={theme}
      emptyText="No new devices found. Try getting closer to the device then pull down to refresh."
      loadingText="Searching for devices..."
      itemDetailTemplate={(item) => {
        if (item.connected) return 'Connected';
        if (item.signal) return `Signal strength ${item.signal}`;
        return 'Disconnected';
      }}
      itemTitlePrefix={itemTitlePrefix}
      isLoading={discovering}
      onRefresh={onRefresh}
      isRefreshing={discovering}
      actions={(item) => {
        const actions = [
          {
            text: 'Flash',
            onPress: onDiscoveredDeviceSwitchChange,
          },
          {
            text: 'Add to zone',
            onPress: onDiscoveredDevicePress,
            primary: true,
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
        if (item.connected) {
          return (
            <CircleIcon
              size={24}
              name={Constants.ICON.device}
              color="#fff"
              bgColor={theme.colors.dark}
            />
          );
        }
        return (
          <SignalIcon size={24} strength={item.signal} color="#fff" bgColor={theme.colors.dark} />
        );
      }}
    />
  );
};

export default DiscoveredDevices;
