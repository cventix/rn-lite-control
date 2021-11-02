//
// File: screens/Auth/SignOut.js
//
import React from 'react';
import { connect } from 'react-redux';
import { actionTypes } from '../../reducers';
import SectionLoader from '../../components/SectionLoader';

@connect(store => ({}))
class SignOut extends React.Component {
  componentDidMount() {
    this.props.dispatch({
      type: actionTypes.auth.DO_SIGNOUT,
    });

    // const { navigation } = this.props;
    // // Navigate to the Root stack / login page
    // navigation.navigate('Auth');

    // // Reset the Navigation stack so the user can't use
    // // hardware button to navigate to previous.
    // const reset = NavigationActions.reset({
    //   index: 0,
    //   actions: [NavigationActions.navigate({ routeName: 'Auth' })],
    // });
    // navigation.dispatch(reset);
  }

  render() {
    return <SectionLoader title="Signing Out..." />;
  }
}

export default SignOut;
