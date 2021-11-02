//
// File: screens/Sidebar/styles.js
//
import { Platform, Dimensions } from 'react-native';
import theme from '../../utils/theme';

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

export default {
  drawerCover: {
    alignSelf: 'stretch',
    height: deviceHeight / 2.5,
    width: null,
    position: 'relative',
    marginBottom: 0,
    // backgroundColor: theme.colors.primary,
    padding: 40,
  },
  coverImage: {
    width: null,
    height: deviceHeight / 3,
  },
  drawerImage: {
    position: 'absolute',
    left: Platform.OS === 'android' ? deviceWidth / 10 : deviceWidth / 9,
    top: Platform.OS === 'android' ? deviceHeight / 13 : deviceHeight / 12,
    width: 210,
    height: 75,
    resizeMode: 'cover',
  },
  text: {
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    fontSize: 16,
    marginLeft: 20,
  },
  badgeText: {
    fontSize: Platform.OS === 'ios' ? 13 : 11,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? -3 : undefined,
  },
  container: {
    flex: 1,
    // backgroundColor: theme.colors.primary,
  },
  drawerSection: {
    flex: 1,
    // borderBottomColor: theme.colors.placeholder,
    // borderBottomWidth: 1,
    paddingVertical: 5,
  },
  footer: {
    height: 50,
    paddingTop: 50 / 4,
    alignItems: 'center',
  },
  disabled: {
    color: theme.colors.light,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 56 / 3.5,
    paddingVertical: 56 / 3.5,
  },
};
