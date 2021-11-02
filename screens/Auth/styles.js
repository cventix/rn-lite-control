//
// File: screens/Auth/styles.js
//
export default {
  topMargin: {
    // marginTop: 25
  },
  flexOne: {
    flex: 1,
    backgroundColor: 'white',
  },
  fixBackground: {
    backgroundColor: '#363159',
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: 100,
    zIndex: -1000,
  },
  content: {
    padding: 10,
    backgroundColor: 'white',
  },
  heading: {
    fontSize: 32,
    fontWeight: '400',
    marginBottom: 30,
    alignSelf: 'center',
  },
  footer: {
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    height: 60,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  forgotPasswordBtn: {
    margin: 15,
    marginTop: 25,
    width: '50%',
    alignSelf: 'center',
  },
};
