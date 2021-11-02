//
// File: screens/Zones/ZoneSettingsSchema.js
//
import React from 'react';
import * as Yup from 'yup';
import { List } from 'react-native-paper';
import Constants from '../../utils/constants';
import string from '../../utils/string';

export const renderEnergyProfileDescription = (index) => {
  // Brilliant Savings
  let title = 'Light delay: 3 - 5 minutes';
  let description = 'Dim light level to 10';

  if (index === 1) {
    // Average Savings
    title = 'Light delay: 0 - 1 minutes';
    description = 'Dim light level to: off';
  } else if (index === 2) {
    // Great Savings
    title = 'Light delay: 1 - 3 minutes';
    description = 'Dim light level to 10';
  }
  return (
    <List.Item
      style={{ borderBottomWidth: 0.7, borderBottomColor: '#ddd' }}
      title={title}
      description={description}
      icon={Constants.ICON.device}
    />
  );
};

const settingsSchema = (zone, onSave, onDelete) => {
  const data = zone.name ? zone : zone.data();
  let energyProfileLabel = 'Average Savings';

  if (data.energyProfile === 2) {
    energyProfileLabel = 'Great Savings';
  } else if (data.energyProfile === 3) {
    energyProfileLabel = 'Brilliant Savings';
  }

  const config = {
    title: 'Zone Settings',
    listKey: zone.id,
    fields: [
      // {
      //   type: 'select',
      //   key: 'pirenabled',
      //   label: 'Group lights for presence detection',
      //   value: data.pirenabled,
      //   valueLabel: data.pirenabled ? 'Yes' : 'No',
      //   placeholder: 'Group Lights...',
      //   options: [{ label: 'Yes', value: true }, { label: 'No', value: false }],
      //   onSave,
      //   renderDescription: () => (
      //     <List.Item
      //       style={{ borderBottomWidth: 0.7, borderBottomColor: '#ddd' }}
      //       title="Group lights for presence detection?"
      //     />
      //   ),
      // },
      {
        type: 'text',
        key: 'name',
        label: 'Name',
        placeholder: 'Enter name...',
        keyboardType: 'default',
        value: data.name,
        onSave,
        schema: Yup.object().shape({
          name: Yup.string()
            .required('Name is required!')
            .matches(Constants.REGEX_ALPHA, {
              message: Constants.REGEX_ALPHA_MSG,
              excludeEmptyString: true,
            })
            .min(3, 'Minimum of 3 characters')
            .max(13, 'Maximum of 13 characters'),
        }),
      },
      // {
      //   type: 'select',
      //   key: 'energyProfile',
      //   label: 'Energy Profile',
      //   value: data.energyProfile || 2, // default
      //   valueLabel: energyProfileLabel,
      //   placeholder: 'Set Energy Profile...',
      //   options: [
      //     { label: 'For Average Savings', value: 1 },
      //     { label: 'For Great Savings', value: 2 },
      //     { label: 'For Brilliant Savings', value: 3 },
      //   ],
      //   onSave,
      //   renderDescription: renderEnergyProfileDescription,
      // },
      {
        type: 'spacer',
      },
      {
        type: 'label',
        label: 'Mesh ID',
        value: string.asHex(data.meshId),
      },
      {
        type: 'label',
        label: 'ID',
        value: zone.id,
      },
      {
        type: 'spacer',
      },
      {
        type: 'button',
        label: 'Delete Zone',
        onPress: onDelete,
      },
    ],
  };
  return config;
};

export default settingsSchema;
