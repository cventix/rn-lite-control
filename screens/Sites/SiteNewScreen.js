//
// File: screens/Sites/SiteNewScreen.js
//
import React from 'react';
import * as Yup from 'yup';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { Text } from 'react-native-paper';
import { Formik } from 'formik';
import { IMessages } from 'luxsmart-comms';

import FullScreenEdit from '../../components/FullScreenEdit';
import TextInput from '../../components/FormikTextInput';
import appStyles from '../styles';
import firebase from '../../config/firebase';
import { actionTypes } from '../../reducers';
import Constants from '../../utils/constants';
import LOG from '../../utils/LOG';
import string from '../../utils/string';
import number from '../../utils/number';

const db = firebase.firestore();

const AddSiteForm = ({
  values, errors, touched, handleSubmit, isSubmitting, setFieldValue,
}) => {
  const hasError = (field, key) => {
    if (!touched[field]) {
      return false;
    }
    if (key && !touched[field][key]) {
      return false;
    }

    let f = field;
    if (key) f += `.${key}`;
    if (!errors[f]) {
      return false;
    }
    // if (key && !errors[field][key]) {
    //   return false;
    // }
    return true;
  };

  return (
    <FullScreenEdit
      nextText="NEXT >"
      backText="< BACK"
      submitText="SAVE"
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      errors={errors}
      touched={touched}
      values={values}
    >
      <View style={appStyles.flexOne}>
        <TextInput
          name="name"
          label="Company Name *"
          value={values.name}
          onChangeText={setFieldValue}
          returnKeyType="next"
          ref={ref => (this.nameRef = ref)}
          onSubmitEditing={() => this.contactnameRef.focus()}
        />
        {hasError('name') && <Text style={appStyles.error}>{errors.name}</Text>}
        <TextInput
          name="contactname"
          label="Contact Name *"
          value={values.contactname}
          onChangeText={setFieldValue}
          returnKeyType="next"
          ref={ref => (this.contactnameRef = ref)}
          onSubmitEditing={() => this.emailRef.focus()}
        />
        {hasError('contactname') && <Text style={appStyles.error}>{errors.contactname}</Text>}
        <TextInput
          autoCapitalize="none"
          name="email"
          label="Contact Email Address *"
          value={values.email}
          onChangeText={setFieldValue}
          keyboardType="email-address"
          returnKeyType="next"
          ref={ref => (this.emailRef = ref)}
          onSubmitEditing={() => this.pinRef.focus()}
        />
        {hasError('email') && <Text style={appStyles.error}>{errors.email}</Text>}
        <TextInput
          name="pin"
          label="Site PIN Code *"
          value={values.pin}
          onChangeText={setFieldValue}
          keyboardType="numeric"
          maxLength={4}
          ref={ref => (this.pinRef = ref)}
        />
        {hasError('pin') && <Text style={appStyles.error}>{errors.pin}</Text>}
      </View>

      <View style={appStyles.flexOne} onLoad={() => this.address1Ref.focus()}>
        <TextInput
          name="address.address1"
          label="Address 1 *"
          value={values.address ? values.address.address1 : null}
          onChangeText={setFieldValue}
          returnKeyType="next"
          ref={ref => (this.address1Ref = ref)}
          withRef
          onSubmitEditing={() => this.address2Ref.focus()}
        />
        {hasError('address', 'address1') && (
          <Text style={appStyles.error}>{errors['address.address1']}</Text>
        )}
        <TextInput
          name="address.address2"
          label="Address 2"
          value={values.address ? values.address.address2 : null}
          onChangeText={setFieldValue}
          returnKeyType="next"
          ref={ref => (this.address2Ref = ref)}
          withRef
          onSubmitEditing={() => this.suburbRef.focus()}
        />
        {hasError('address', 'address2') && (
          <Text style={appStyles.error}>{errors['address.address2']}</Text>
        )}
        <TextInput
          name="address.suburb"
          label="Suburb *"
          value={values.address ? values.address.suburb : null}
          onChangeText={setFieldValue}
          returnKeyType="next"
          ref={ref => (this.suburbRef = ref)}
          withRef
          onSubmitEditing={() => this.stateRef.focus()}
        />
        {hasError('address', 'suburb') && (
          <Text style={appStyles.error}>{errors['address.suburb']}</Text>
        )}

        <View style={appStyles.row}>
          <View style={appStyles.col}>
            <TextInput
              name="address.state"
              label="State *"
              value={values.address ? values.address.state : null}
              onChangeText={setFieldValue}
              returnKeyType="next"
              ref={ref => (this.stateRef = ref)}
              withRef
              onSubmitEditing={() => this.postcodeRef.focus()}
            />
            {hasError('address', 'state') && (
              <Text style={appStyles.error}>{errors['address.state']}</Text>
            )}
          </View>
          <View style={appStyles.col}>
            <TextInput
              name="address.postcode"
              label="Postcode *"
              value={values.address ? values.address.postcode : null}
              onChangeText={setFieldValue}
              returnKeyType="done"
              ref={ref => (this.postcodeRef = ref)}
              withRef
            />

            {hasError('address', 'postcode') && (
              <Text style={appStyles.error}>{errors['address.postcode']}</Text>
            )}
          </View>
        </View>
      </View>
    </FullScreenEdit>
  );
};

@connect(store => ({
  currentSite: store.currentSite,
  user: store.auth.user,
}))
class SiteNewScreen extends React.Component {
  static title = 'Create New Job Site';

  onSave = async (values, { setSubmitting, setErrors }) => {
    let isCreated = false;
    try {
      // Save the site.
      const docRef = await db.collection('sites').add({
        ...values,
        creationTime: firebase.firestore.FieldValue.serverTimestamp(),
        userRef: this.props.user.doc,
        userID: this.props.user.key, // Primarily for use in admin site display.
        network_key: IMessages.network_settings_t.generateNetworkKey(), // 16 hex values as per comms spec.
      });

      // Set the meshId of the site to be a number hash of the firestore unique document id.
      await docRef.set({ meshId: string.hashCode(docRef.id) }, { merge: true });

      this.props.dispatch({ type: actionTypes.site.FETCH_SITE, siteid: docRef.id });
      isCreated = true;
    } catch (error) {
      LOG.console(error);
      this.props.dispatch({ type: actionTypes.site.FETCH_SITE_FAILED, error });
      setErrors(error);
    } finally {
      setSubmitting(false);
    }

    if (isCreated) {
      this.props.navigation.navigate('SiteSelected');
    }
  };

  getValidationSchema = (values) => {
    const alphaRegex = Constants.REGEX_ALPHA;
    const alphaMsg = Constants.REGEX_ALPHA_MSG;
    const schema = Yup.object().shape({
      contactname: Yup.string()
        .required('Contact Name is required!')
        .matches(/^[\w\s]+$/, 'Alphanumeric and _ only')
        .min(5, 'Minimum of 5 characters')
        .max(100, 'Maximum of 100 characters'),
      name: Yup.string()
        .required('Company Name is required!')
        .matches(/^[\w\s]+$/, 'Alphanumeric and _ only')
        .min(5, 'Minimum of 5 characters')
        .max(100, 'Maximum of 100 characters'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required!'),
      pin: Yup.string()
        .required('PIN is required')
        .min(4, 'PIN must be 4 digits')
        .max(4, 'PIN must be 4 digits')
        .matches(/^[\d]+$/, 'PIN must be number')
        .notOneOf(['1234', '2018', '2019', '2020', '2021'], 'Please choose a stronger PIN code')
        .test('pin', 'Please choose a stronger PIN', val => !/^([0-9])\1*$/g.test(val)),
      address: Yup.object({
        address1: Yup.string()
          .required('Address 1 is required')
          .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
        suburb: Yup.string()
          .required('Suburb is required')
          .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
        state: Yup.string()
          .required('State is required')
          .matches(alphaRegex, { message: alphaMsg, excludeEmptyString: true }),
        postcode: Yup.string()
          .required('Postcode is required')
          .matches(/^\d{4}$/, { message: 'Postcode must be 4 digits', excludeEmptyString: true })
          .test('postcode', 'Postcode cannot be the same as PIN code.', val => val !== values.pin),
      }),
    });
    return schema;
  };

  getErrorsFromValidationError = (validationError) => {
    const FIRST_ERROR = 0;
    return validationError.inner.reduce(
      (errors, error) => ({
        ...errors,
        [error.path]: error.errors[FIRST_ERROR],
      }),
      {},
    );
  };

  validate = (values) => {
    const validationSchema = this.getValidationSchema(values);
    try {
      validationSchema.validateSync(values, { abortEarly: false });
      return {};
    } catch (error) {
      return this.getErrorsFromValidationError(error);
    }
  };

  generatePin() {
    this.pin = number.getRandomIntInclusive(0, 9999);
    // PAD with 0 if not 4 digits.
    this.pin = `0000${this.pin}`.substr(-4, 4);

    try {
      this.schema = this.getValidationSchema({ pin: this.pin });
      Yup.reach(this.schema, 'pin').validateSync(this.pin);
    } catch (err) {
      // Validation Failed so regenerate
      return this.generatePin();
    }
    return this.pin;
  }

  render() {
    const initialValues = {
      pin: this.pin || this.generatePin(),
    };
    this.schema = this.schema || this.getValidationSchema(initialValues);
    return (
      <Formik
        component={AddSiteForm}
        onSubmit={this.onSave}
        // validationSchema={this.schema}
        initialValues={initialValues}
        validate={this.validate}
      />
    );
  }
}

export default SiteNewScreen;
