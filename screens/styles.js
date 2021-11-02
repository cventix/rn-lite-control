//
// File: screens/styles.js
//

import theme from '../utils/theme';

const bigIconSize = 128;
const { colors } = theme;

export default {
  container: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  content: {
    margin: 10,
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ddd',
  },
  error: {
    color: colors.error,
  },
  headline: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  icon: {
    backgroundColor: 'transparent',
  },
  circleIcon: {
    // backgroundColor: 'transparent',
    position: 'absolute',
    left: bigIconSize / 4,
    top: bigIconSize / 4,
    color: colors.paper,
    // transform: [{ translate: [0, 0, 1] }],
  },
  circleIconContainer: {
    marginTop: 20,
    width: bigIconSize * 1.5,
    height: bigIconSize * 1.5,
    borderRadius: (bigIconSize * 1.5) / 2,
    backgroundColor: colors.primary,
  },
  introCenter: {
    marginHorizontal: 60,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introButton: {
    width: 250,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },

  // TabBar
  tabbar: {
    backgroundColor: colors.paper,
  },
  tab: {},
  indicator: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
    // fontWeight: '400',
  },

  //
  //
  // Utilities
  //
  //
  // Children in middle will be horizonally and vertically centered.
  //
  middle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spacerSml: {
    marginVertical: 10,
  },
  spacer: {
    marginVertical: 20,
  },
  spacerBottom: {
    marginBottom: 20,
  },
  spacerHorizontal: {
    marginHorizontal: 15,
  },
  spacerVertical: {
    marginVertical: 15,
  },
  padBottom: {
    paddingBottom: 100,
  },
  spacerTop: {
    marginTop: 20,
  },
  spacerTopX2: {
    marginTop: 40,
  },
  center: {
    textAlign: 'center',
  },
  centerSelf: {
    alignSelf: 'center',
  },
  cardActionsRight: {
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  col: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 10,
  },
  spreadOut: {
    justifyContent: 'space-between',
  },
  border: {
    borderWidth: 1,
  },
  modal: {
    margin: 0,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    borderRadius: 3,
    backgroundColor: '#fff',
    padding: 0,
  },
};
