//
// File: utils/siteSettingsSchema.js
//
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import * as Yup from 'yup';
import Constants from '../utils/constants';
import LOG from '../utils/LOG';

//
// Required for settingsHO
//

const settingsSchema = (site, devices, onSave, navigation) => {
  // if(!site) return { title: 'Not found', listKey: 0, fields: []}
  const data = site && site.data();
  const zoned = devices.filter(d => d.zoneid);
  // const calibrated = devices.filter(d => d.lastcalibrated);
  const calibrated = devices.filter(d => d.calibrated);

  let percentZoned = 0;
  let percentCalibrated = 0;

  if (zoned.length) {
    percentZoned = zoned.length / devices.length;
    percentZoned *= 100;
    percentZoned = percentZoned.toFixed(2);
  }
  if (calibrated.length) {
    percentCalibrated = calibrated.length / devices.length;
    percentCalibrated *= 100;
    percentCalibrated = percentCalibrated.toFixed(2);
  }

  const alphaRegex = Constants.REGEX_ALPHA;
  const alphaMsg = Constants.REGEX_ALPHA_MSG;

  const config = {
    title: `${data.name} Settings`,
    listKey: site.id,
    fields: [
      {
        type: 'label',
        label: 'Calibrated',
        value: `${percentCalibrated}%`,
      },
      {
        type: 'label',
        label: 'Zoned',
        value: `${percentZoned}%`,
      },
      {
        type: 'spacer',
      },
      {
        type: 'function',
        label: 'Commissioning Report PDF',
        onClick: async () => {
          try {
            const res = await axios.get(
              `${Constants.REPORT_URL}doCommissionReport?siteid=${site.id}&format=pdf`
            );
            await WebBrowser.openBrowserAsync(res.data.publicurl);
          } catch (err) {
            LOG.console(err);
          }
        },
      },
      {
        type: 'function',
        label: 'Commissioning Report CSV',
        onClick: async () => {
          try {
            const res = await axios.get(
              `${Constants.REPORT_URL}doCommissionReport?siteid=${site.id}&format=csv`
            );
            await WebBrowser.openBrowserAsync(res.data.publicurl);
          } catch (err) {
            LOG.console(err);
          }
        },
      },
      {
        type: 'spacer',
      },
      {
        type: 'text',
        key: 'name',
        label: 'Company Name',
        placeholder: 'Enter name...',
        keyboardType: 'default',
        value: data.name,
        onSave,
        schema: Yup.object().shape({
          name: Yup.string()
            .required('Name is required!')
            .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true })
            .min(5, 'Minimum of 5 characters')
            .max(100, 'Maximum of 100 characters'),
        }),
      },
      {
        type: 'text',
        key: 'contactname',
        label: 'Contact Name',
        placeholder: 'Enter name...',
        keyboardType: 'default',
        value: data.contactname,
        onSave,
        schema: Yup.object().shape({
          contactname: Yup.string()
            .required('Contact Name is required!')
            .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true })
            .min(5, 'Minimum of 5 characters')
            .max(100, 'Maximum of 100 characters'),
        }),
      },
      {
        type: 'text',
        key: 'email',
        label: 'Contact Email',
        placeholder: 'Enter name...',
        keyboardType: 'email-address',
        value: data.email,
        onSave,
        schema: Yup.object().shape({
          email: Yup.string().email('Invalid email address').required('Email is required!'),
        }),
      },
      {
        type: 'spacer',
      },
      {
        type: 'text',
        key: 'address.address1',
        label: 'Address 1 *',
        placeholder: 'Enter Address 1...',
        keyboardType: 'default',
        value: data.address ? data.address.address1 : null,
        onSave,
        schema: Yup.object().shape({
          address: Yup.object({
            address1: Yup.string()
              .required('Address 1 is required!')
              .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
          }),
        }),
      },
      {
        type: 'text',
        key: 'address.address2',
        label: 'Address 2',
        placeholder: 'Enter Address 2...',
        keyboardType: 'default',
        value: data.address ? data.address.address2 : null,
        onSave,
        schema: Yup.object().shape({
          address: Yup.object({
            address2: Yup.string().matches(alphaRegex, {
              message: alphaMsg,
              excludeEmptyString: true,
            }),
          }),
        }),
      },
      {
        type: 'text',
        key: 'address.suburb',
        label: 'Suburb *',
        placeholder: 'Enter Suburb...',
        keyboardType: 'default',
        value: data.address ? data.address.suburb : null,
        onSave,
        schema: Yup.object().shape({
          address: Yup.object({
            suburb: Yup.string()
              .required('Suburb is required!')
              .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
          }),
        }),
      },
      {
        type: 'text',
        key: 'address.state',
        label: 'State *',
        placeholder: 'Enter State...',
        keyboardType: 'default',
        value: data.address ? data.address.state : null,
        onSave,
        schema: Yup.object().shape({
          address: Yup.object({
            state: Yup.string()
              .required('State is required!')
              .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
          }),
        }),
      },
      {
        type: 'text',
        key: 'address.postcode',
        label: 'Postcode *',
        placeholder: 'Postcode...',
        keyboardType: 'default',
        value: data.address ? data.address.postcode : null,
        onSave,
        schema: Yup.object().shape({
          address: Yup.object({
            postcode: Yup.string()
              .required('Postcode is required!')
              .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
          }),
        }),
      },
      {
        type: 'spacer',
      },
      {
        type: 'label',
        label: 'ID',
        value: site.id,
      },
    ],
  };

  return config;
};

export default settingsSchema;
