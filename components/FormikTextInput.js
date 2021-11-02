//
// File: components/FormikTextInput.js
//
import * as React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from 'react-native-paper';

export default class FormikTextInput extends React.Component {
  static contextTypes = {
    formik: PropTypes.object,
  };

  handleChange = (value) => {
    // remember that onChangeText will be Formik's setFieldValue
    this.props.onChangeText(this.props.name, value);
  };

  handleBlur = () => {
    this.context.formik.setFieldTouched(this.props.name, true);
  };

  focus = () => {
    this.textInputRef.focus();
  };

  render() {
    // we want to pass through all the props except for onChangeText and onBlur
    const { onChangeText, ...otherProps } = this.props;
    const { name } = this.props;
    const { formik } = this.context;

    const wasTouched = formik.dirty ? formik.touched[name] : false;
    const fieldError = wasTouched && formik.errors[name];

    return (
      <TextInput
        ref={ref => (this.textInputRef = ref)}
        onChangeText={this.handleChange}
        onBlur={this.handleBlur}
        {...otherProps}
      />
    );
  }
}
