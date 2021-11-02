//
// File: components/Settings/SettingDetail.js
//
import React from 'react';
import { View, ActivityIndicator, Picker } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

import styles from './styles';

const SettingText = ({
  label, value, onChange, ...props
}) => (
  <TextInput
    autoFocus
    name={label}
    label={label}
    value={value}
    onChangeText={text => onChange(text)}
    {...props}
  />
);

const SettingSelect = ({ options, onChange, value }) => {
  const radios = options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />);
  return (
    <Picker selectedValue={value} onValueChange={onChange} itemStyle={styles.pickerItem}>
      {radios}
    </Picker>
  );
};

class SettingDetail extends React.Component {
  renderLoader() {
    const { field } = this.props;
    return (
      <View style={styles.content}>
        <ActivityIndicator size="small" />
        <Text style={styles.title}>Loading {field.label}...</Text>
      </View>
    );
  }

  render() {
    const {
      field, onChange, value, error, renderDescription,
    } = this.props;
    if (field.type === 'function') {
      return this.renderLoader();
    }

    return (
      <View style={styles.content}>
        {renderDescription && renderDescription(value)}
        {field.type === 'text' && (
          <View>
            <SettingText
              label={field.label}
              value={value}
              onChange={onChange}
              underlineColor={error ? styles.colors.error : null}
              returnKeyType="done"
            />
            {error && <Text style={{ color: styles.colors.error }}>{error}</Text>}
          </View>
        )}
        {field.type === 'select' && (
          <SettingSelect options={field.options} value={value} onChange={onChange} />
        )}
      </View>
    );
  }
}

export default SettingDetail;
