//
// File: utils/theme.js
//
import color from 'color';
import { DefaultTheme } from 'react-native-paper';

// Theme
const brandColors = {
  LuxDarkPurple: '#363159',
  LuxLightPurple: '#6361AC',
  LuxYellow: '#FFDE17',
  LuxDarkGrey: '#A7A9AC',
  LuxLightGrey: '#E6E7E8',
};

const theme = {
  ...DefaultTheme,
  dark: false,
  roundness: 3,
  colors: {
    ...DefaultTheme.colors,
    primary: brandColors.LuxDarkPurple,
    primaryDark: color(brandColors.LuxDarkPurple)
      .darken(0.2)
      .rgb()
      .string(),
    accent: brandColors.LuxLightPurple,
    // background: brandColors.LuxLightGrey,
    background: '#fff',
    accent2: brandColors.LuxYellow,
    paper: '#fff',
    text: '#111',
    textLight: brandColors.LuxLightGrey,
    dark: brandColors.LuxDarkGrey,
    light: '#ECEFF1',
    error: '#ff0033',
    secondaryText: color('#111')
      .alpha(0.6)
      .rgb()
      .string(),
    disabled: color('#111')
      .alpha(0.26)
      .rgb()
      .string(),
    placeholder: color('#111')
      .alpha(0.38)
      .rgb()
      .string(),
  },
};

export default theme;
