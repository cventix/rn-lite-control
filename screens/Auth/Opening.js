//
// File: screens/Auth/Opening.js
//
import React from 'react';
import { StyleSheet, Image, Platform } from 'react-native';
import { Text, View } from 'react-native-animatable';
import { MaterialCommunityIcons as Icon } from 'react-native-vector-icons';
import imgGoogle from '../../assets/images/icons8-google-48.png';

import CustomButton from '../../components/CustomButton';
import metrics from '../../config/metrics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: metrics.DEVICE_WIDTH * 0.1,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginVertical: 5,
  },
  createAccountButton: {
    // backgroundColor: '#9B9FA4',
    backgroundColor: '#FFF',
  },
  googleButton: {
    // backgroundColor: '#9B9FA4',
    backgroundColor: '#FFF',
  },
  facebookButton: {
    backgroundColor: '#4267b2',
  },
  facebookButtonText: {
    color: '#fff',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
  },
  createAccountButtonText: {
    // color: 'white',
    color: '#555',
  },
  separatorContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 10,
  },
  separatorLine: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    height: StyleSheet.hairlineWidth,
    borderColor: '#9B9FA4',
  },
  separatorOr: {
    color: '#9B9FA4',
    marginHorizontal: 8,
  },
  signInButton: {
    backgroundColor: '#363159',
  },
  signInButtonText: {
    color: 'white',
  },
});

const Opening = ({
  onCreateAccountPress,
  onSignInPress,
  oAuthGoogle,
  oAuthFacebook,
  oAuthApple,
  isLoadingGoogle,
  isLoadingFacebook,
  isLoadingApple,
}) => (
  <View style={styles.container}>
    <View style={styles.buttonContainer} animation="zoomIn" delay={600} duration={400}>
      <CustomButton
        icon={<Image source={imgGoogle} style={{ width: 24, height: 24 }} />}
        isLoading={isLoadingGoogle}
        text="Sign in with Google"
        onPress={oAuthGoogle}
        buttonStyle={styles.googleButton}
        textStyle={styles.createAccountButtonText}
      />
    </View>
    {/* <View style={styles.separatorContainer} animation="zoomIn" delay={700} duration={400}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorOr}>Or</Text>
      <View style={styles.separatorLine} />
    </View> */}
    <View style={styles.buttonContainer} animation="zoomIn" delay={800} duration={400}>
      <CustomButton
        icon={<Icon name="facebook" size={24} color="#fff" />}
        isLoading={isLoadingFacebook}
        text="Continue with Facebook"
        onPress={oAuthFacebook}
        buttonStyle={styles.facebookButton}
        textStyle={styles.facebookButtonText}
      />
    </View>
    {Platform.OS === 'ios' ? (
      <View style={styles.buttonContainer} animation="zoomIn" delay={1000} duration={400}>
        <CustomButton
          icon={<Icon name="apple" size={24} color="#fff" />}
          isLoading={isLoadingApple}
          text="Continue with Apple"
          onPress={oAuthApple}
          buttonStyle={styles.appleButton}
          textStyle={styles.appleButtonText}
        />
      </View>
    ) : null}
    <View style={styles.separatorContainer} animation="zoomIn" delay={900} duration={400}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorOr}>Or</Text>
      <View style={styles.separatorLine} />
    </View>
    <View style={styles.buttonContainer} animation="zoomIn" delay={1000} duration={400}>
      <CustomButton
        icon={<Icon name="email" size={24} />}
        text="Create account with Email"
        onPress={onCreateAccountPress}
        buttonStyle={styles.createAccountButton}
        textStyle={styles.createAccountButtonText}
      />
    </View>
    {/* <View style={styles.separatorContainer} animation="zoomIn" delay={1100} duration={400}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorOr}>Or</Text>
      <View style={styles.separatorLine} />
    </View> */}
    <View style={styles.buttonContainer} animation="zoomIn" delay={1200} duration={400}>
      <CustomButton
        icon={<Icon name="email" size={24} color="#fff" />}
        text="Sign in with Email"
        onPress={onSignInPress}
        buttonStyle={styles.signInButton}
        textStyle={styles.signInButtonText}
      />
    </View>
  </View>
);

export default Opening;
