//
// File: components/Settings.js
//

import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from 'react-native-vector-icons';
import { TouchableRipple, Divider, Button } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser'
import Modal from 'react-native-modal';

import Toolbar from '../Toolbar';
import CapitalisedText from '../CapitalisedText';
import SettingsSwitch from './SettingSwitch';
import SettingDetail from './SettingDetail';
import styles from './styles';

const ListItem = ({
  onItemPress, field, onClose, isSaving,
}) => {
  const loadDetail = async (item) => {
    // Navigate to detail view
    switch (item.type) {
      case 'text':
      case 'select':
        onItemPress(item);
        break;
      case 'href':
        WebBrowser.openBrowserAsync(item.value);
        onClose();
        break;
      case 'function':
        // Transition to the loading screen first.
        onItemPress(item);

        // Wait for the function call to complete.
        await item.onClick();

        // Transition back from the loading detail screen.
        onItemPress(item);

        // Close the settings dialog as the function call has achieved its goal, i.e. opening
        // up a browser link, etc.
        onClose();
        break;
      case 'switch':
      case 'label':
      case 'spacer':
        // These require no action or are handled by own component.
        break;
      default:
        throw Error('Unknown tyoe', item.type);
    }
  };

  let rightSide = null;
  if (isSaving) {
    rightSide = <ActivityIndicator />;
  } else if (field.type === 'switch') {
    rightSide = <SettingsSwitch {...field} />;
  } else if (field.type === 'select' || field.type === 'text') {
    rightSide = <Icon name="keyboard-arrow-right" size={20} />;
  } else if (field.type === 'href') {
    rightSide = <Icon name="open-in-browser" size={20} />;
  }

  return (
    <TouchableRipple
      onPress={() => {
        // Switches will be toggled from the list
        if (!isSaving && field.type !== 'switch') {
          loadDetail(field, field.value);
        }
      }}
    >
      <View style={styles.row}>
        <View style={[styles.text]}>
          <CapitalisedText numberOfLines={1}>{field.label}</CapitalisedText>
        </View>
        <View style={[styles.text, styles.placeholder]}>
          {/* <Text style={styles.placeholderText} numberOfLines={1}> */}
          <Text style={styles.placeholderText}>
            {isSaving && 'Saving...'}
            {!isSaving &&
              field.type !== 'href' &&
              (field.valueLabel || field.value || field.placeholder)}
          </Text>
        </View>
        <View style={styles.iconContainer}>{rightSide}</View>
      </View>
    </TouchableRipple>
  );
};

const SettingsList = ({
  config, onItemPress, onClose, isSaving,
}) => {
  const components = config.fields.map((f, index) => {
    let Comp = null;
    const itemSaving = isSaving.indexOf(f.key) !== -1;

    switch (f.type) {
      case 'spacer':
        Comp = (
          <View style={[styles.spacer]}>
            <Text />
          </View>
        );
        break;
      case 'button':
        Comp = (
          <Button
            style={styles.listBtn}
            primary
            onPress={() => {
              onClose();
              f.onPress();
            }}
          >
            {f.label}
          </Button>
        );
        break;
      default:
        Comp = (
          <View>
            <ListItem onItemPress={onItemPress} field={f} onClose={onClose} isSaving={itemSaving} />
            <Divider />
          </View>
        );
        break;
    }

    return <View key={`${config.listKey}_${index}`}>{Comp}</View>;
  });

  return <View style={styles.flexOne}>{components}</View>;
};

// const devconfig = {
//   title: 'My Settings',
//   listKey: 'unique key used in the list', i.e. zone.id.
//   fields: [
//       {
//        type: 'label',
//        label: 'ID',
//        value: data.id,
//      },
//      {
//         type: 'spacer',
//      },
//      {
//        type: 'href',
//        label: 'Commissioning Report PDF',
//        value: 'http://www.smirklighting.com?report=commisioning&format=pdf',
//      },
//     {
//       type: 'text',
//       key: 'name',
//       label: 'Name',
//       placeholder: 'Enter name...',
//       keyboardType: 'default',
//       value: 'My favorite light',
//       onSave: (key, val) => console.log('Saved name', key, val),
//     },
//     {
//       type: 'select',
//       key: 'zoneid',
//       label: 'Zone',
//       value: 1,
//       valueLabel: 'my fav zone',
//       options: [{ label: 'my fav zone', value: 1 }, { label: 'office space', value: 2 }],
//       placeholder: 'Select a zone...',
//       onSave: (key, val) => console.log('Saved zone', key, val),
//     },
//     {
//       type: 'switch',
//       key: 'hasPir',
//       label: 'PIR Enabled',
//       value: true,
//       onSave: (key, val) => console.log('PIR enabled', key, val),
//     },
//     {
//      type: 'button',
//      label: 'Delete',
//      onPress: this.onDeleteZone,
//    },
//    {
//      type: 'function',
//      label: 'Call a function on click',
//      onClick: async () => {
//        // Do stuff.
//     },
//   },
//   ],
// };

class Settings extends React.Component {
  state = {
    showDetail: false,
    detailItem: null,
    value: null,
    error: null,
    isSaving: [],
  };

  onChange = (value) => {
    const { schema, key } = this.state.detailItem;
    this.touched = true;
    if (schema) {
      // Support 1 level nested objects.
      const keys = key.split('.');
      const container = { [keys[0]]: value };
      if (keys.length > 1) {
        container[keys[0]] = { [keys[1]]: value };
      }

      schema
        .validate({ ...container })
        .then((val) => {
          this.setState({ value, error: null });
        })
        .catch((err) => {
          this.setState({ value, error: err.message });
        });
    } else {
      this.setState({ value, error: null });
    }
  };

  onSave = async () => {
    const { detailItem, value, error } = this.state;
    const { key } = detailItem;

    if (!this.touched) {
      // Nothing changed so we can return here.
      this.toggleDetail();
      return;
    }

    // There are validation errors so don't allow save.
    if (error !== null) {
      return;
    }

    // Add the item key to the isSaving array so the
    // SettingsList knows how to render items currently saving.
    this.setState(prevState => ({
      isSaving: [...prevState.isSaving, key],
    }));

    // Move back to the settings list as we are now rendering that
    // the item is saving.
    this.toggleDetail();

    // Wait for the save to complete before continuing.
    await detailItem.onSave(key, typeof value === 'string' ? value.trim() : value);

    // Remove the item key from the isSaving array so the settings list
    // knows to stop rendering that the item is saving.
    this.setState(prevState => ({
      isSaving: prevState.isSaving.filter(item => item !== key),
    }));
  };

  toggleDetail = (field, value) => {
    // When the detail view is opened or closed, reset the items touched property
    // so that we know how to set approipriate defaults in render.
    this.touched = false;
    this.setState({
      showDetail: !this.state.showDetail,
      detailItem: field,
      value,
      error: null,
    });

    if (this.props.onEdit) {
      this.props.onEdit(field, value);
    }
  };

  render() {
    let title = null;
    let onBack = null;
    let onSave = null;
    let onDrawerPress = null;

    const {
      config, visible, onClose, modal, onToggleDrawer, isInline,
    } = this.props;
    const {
      showDetail, detailItem, value, isSaving, error,
    } = this.state;

    if (!config) {
      // Nothing to do so return
      return null;
    }

    let fieldVal = value;
    // Set the default value if the item hasn't been edited yet.
    if (detailItem && !this.touched) {
      fieldVal = detailItem.value;
    }

    title = config.title;
    onBack = onClose;

    if (showDetail) {
      title = `Set ${this.state.detailItem.label.replace(/\*/g, '')}`;
      onBack = this.toggleDetail;
      onSave = this.onSave;
    } else if (modal === false && onToggleDrawer) {
      // Show the drawer toggle instead of back buttton when not in modal mode
      onBack = null;
      onDrawerPress = onToggleDrawer;
    }

    const Content = (
      <View style={styles.container}>
        {!isInline && (
          <Toolbar
            title={title}
            onBackPress={onBack}
            onSave={onSave}
            saveDisabled={!this.touched || error}
            onDrawerPress={onDrawerPress}
          />
        )}

        {showDetail && (
          <Modal
            avoidKeyboard
            backdropOpacity={0.5}
            backdropColor="#000"
            transparent
            isVisible={showDetail}
            onBackButtonPress={this.toggleDetail}
            onBackdropPress={this.toggleDetail}
            style={styles.modal}
          >
            <View style={styles.modalContainer}>
              <SettingDetail
                onClose={this.toggleDetail}
                field={detailItem}
                onChange={this.onChange}
                value={fieldVal}
                error={error}
                renderDescription={detailItem.renderDescription}
              />
              <View style={[styles.buttonRow]}>
                <Button style={styles.flexOne} raised onPress={onBack}>
                  Cancel
                </Button>
                <Button
                  style={styles.flexOne}
                  raised
                  primary
                  onPress={onSave}
                  disabled={!this.touched || error}
                >
                  Save
                </Button>
              </View>
            </View>
          </Modal>
        )}

        <SettingsList
          config={config}
          onItemPress={this.toggleDetail}
          onClose={onClose}
          isSaving={isSaving}
        />
      </View>
    );

    if (modal === false) {
      return Content;
    }
    return (
      <Modal visible={visible} onRequestClose={onClose} animationType="slide">
        {Content}
      </Modal>
    );
  }
}

export default Settings;
