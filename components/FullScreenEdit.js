//
// File: components/Toolbar.js
//
import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, ScrollView } from 'react-native';
import { withTheme, Button, Card, Text } from 'react-native-paper';
import _ from 'lodash';

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBar: {
    borderBottomWidth: 1,
    marginTop: -15,
    marginHorizontal: -15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  left: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  right: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  content: {
    margin: 10,
    marginBottom: 10,
    flex: 1,
  },
  children: {
    marginBottom: 20,
  },
  button: {
    margin: 0,
    padding: 0,
  },
});

//
// This component assumes it will be used as a Formik component with Yup validation.
// https://github.com/jaredpalmer/formik
//
class FullScreenEdit extends React.Component {
  static contextTypes = {
    formik: PropTypes.object,
  };

  constructor() {
    super();
    this.state = {
      screen: 0,
    };
  }

  onPress = (event) => {
    const {
      touched, errors, values, children, handleSubmit, initialValues,
    } = this.props;
    const { screen } = this.state;
    const { formik } = this.context;
    const screenCount = children.length;
    const visibleChild = children[screen];

    // Weirdly, If there is one child, then props.children is an object,
    // otherwise it is an array. Let's convert to an array if it isn't already.
    let screenChildren = visibleChild.props.children;
    if (!Array.isArray(screenChildren)) {
      screenChildren = Array(screenChildren);
    }

    // Force each element on this screen to be touched so the validation triggers,
    // even when an onBlur has not occurred.
    const flattenedChildren = this.flattenNestedChildren(screenChildren);
    flattenedChildren.forEach(input => input && formik.setFieldTouched(input.props.name, true));

    // First time next clicked so exit if nothing has been touched.
    if (Object.keys(touched).length === 0) return;

    const screenChildKeys = flattenedChildren
      .map((c) => {
        // Child elements may have a name of address.suburb.
        // The Yup validation 'errors' array passed into this
        // component will only ever contain 'address', even if there
        // are multiple address objects. Due to this we will only
        // populate this array with the top level object name defined
        // in the component name.
        if (c && c.props && c.props.name) return c.props.name.split('.')[0];
        return null;
      })
      .filter(c => c);

    // If the this screens touched keys appear in the errors then we have a problem.
    // This is done this way as the errors for the entire form will
    // always be present, even if the form is split over multiple
    // screens. Touched fields indicate current screen.
    const hasError = _.intersection(Object.keys(touched), Object.keys(errors), screenChildKeys);

    if (!Object.keys(values).length || hasError.length) {
      return;
    }

    const nextScreen = screen + 1;

    if (nextScreen === screenCount) {
      handleSubmit(event);
    } else {
      this.setState({ screen: nextScreen });

      // Fire the next screens load function if it has one.
      // This allows the next screen to focus input elements, etc.
      _.debounce(() => {
        if (children[nextScreen].props.onLoad) {
          children[nextScreen].props.onLoad();
        }
      }, 20)();
    }
  };

  onBack = () => {
    const { screen } = this.state;
    const prevScreen = screen - 1;

    if (prevScreen >= 0) {
      this.setState({ screen: prevScreen });
    }
  };

  flattenNestedChildren(children) {
    let flattened = [];
    children.forEach((c) => {
      if (c && c.props) {
        if (c.props.children && Array.isArray(c.props.children)) {
          flattened = flattened.concat(this.flattenNestedChildren(c.props.children));
        } else if (c.props.name) {
          flattened.push(c);
        }
      }
    });
    return flattened;
  }

  render() {
    const {
      submitText, isSubmitting, children, theme, nextText, backText,
    } = this.props;
    const { screen } = this.state;
    const screenCount = children.length;
    const btnText = screen + 1 < screenCount ? nextText : submitText;
    return (
      <Card style={styles.content}>
        <Card.Content style={styles.flexOne}>
          <View style={[styles.row, styles.topBar, { borderColor: theme.colors.light }]}>
            <View style={styles.left}>
              <Text style={{ color: theme.colors.secondaryText }}>
                Step {screen + 1} of {screenCount}
              </Text>
            </View>

            <View style={styles.right}>
              {screen > 0 && (
                <Button compact style={styles.button} onPress={this.onBack}>
                  {backText}
                </Button>
              )}

              <Button
                primary
                compact
                style={styles.button}
                onPress={this.onPress}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {!isSubmitting && btnText}
              </Button>
            </View>
          </View>

          <View style={[styles.flexOne, styles.children]}>
            <ScrollView>{children.length ? children[screen] : children}</ScrollView>
          </View>
        </Card.Content>
      </Card>
    );
  }
}

export default withTheme(FullScreenEdit);
