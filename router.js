//
// File: router.js
//
import React from "react";
import { createSwitchNavigator, createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { createDrawerNavigator } from "react-navigation-drawer";

// Screens / Containers
import SignOut from "./screens/Auth/SignOut";
import TutorialScreen from "./screens/Tutorial/TutorialScreen";
import SiteScreen from "./screens/Sites/SiteScreen";
import SiteNewScreen from "./screens/Sites/SiteNewScreen";
import SiteTutorialScreen from "./screens/Sites/SiteTutorialScreen";
import DeviceDetailScreen from "./screens/Devices/DeviceDetailScreen";
import ZoneScreen from "./screens/Zones/ZoneScreen";
import ZoneDetailScreen from "./screens/Zones/ZoneDetailScreen";
// Switches commented out until we implement.
// import SwitchScreen from './screens/Switches/SwitchScreen';
import SplashScreen from "./screens/Splash/SplashScreen";
import ConfigScreen from "./screens/Config/ConfigScreen";
import SoftwareUpdateScreen from "./screens/Config/SoftwareUpdateScreen";
import DiagnosticsScreen from "./screens/Config/DiagnosticsScreen";
// import ReportScreen from './screens/Report/ReportScreen';
import AuthScreen from "./screens/Auth";
import SideBar from "./screens/Sidebar/AppSidebar";

// components
import Toolbar from "./components/Toolbar";
import Constants from "./utils/constants";

const drawerScreens = ["ZoneManage", "SwitchManage"];

const Routes = (screens) =>
  Object.keys(screens)
    .map((id) => ({ id, item: screens[id] }))
    .reduce((acc, { id, item }) => {
      const Comp = item;
      const Screen = (props) => <Comp {...props} />;

      const showDrawer = drawerScreens.indexOf(id) !== -1;

      Screen.navigationOptions = (props) => ({
        header: () => (
          <Toolbar
            title={props.navigation.getParam("title") || Comp.title}
            onBackPress={!showDrawer ? () => props.navigation.goBack() : null}
            onDrawerPress={
              showDrawer ? () => props.navigation.toggleDrawer() : null
            }
            // onSettingsPress={
            //   Comp.hasSettings
            //     ? () =>
            //         //
            //         // Components with a hasConfig static book will render a
            //         // settings icon in the header which will trigger
            //         // the components settingsPress event handler.
            //         //
            //         props.navigation.state.params.settingsPress()
            //     : // props.navigation.navigate('Settings', {
            //       //   config: props.navigation.getParam('config') || Comp.config,
            //       // })
            //       null
            // }
          />
        ),
        ...(typeof Comp.navigationOptions === "function"
          ? Comp.navigationOptions(props)
          : Comp.navigationOptions),
      });

      return {
        ...acc,
        [id]: { screen: Screen },
      };
    }, {});

const SiteSelectedScreens = {
  DeviceDetail: DeviceDetailScreen,
  ZoneManage: ZoneScreen,
  ZoneDetail: ZoneDetailScreen,
};

const ZoneStack = createStackNavigator(
  {
    ...Routes(SiteSelectedScreens),
  },
  {
    initialRouteName: "ZoneManage",
  }
);

const LoggedInScreens = {
  SiteManage: SiteScreen,
  SiteNew: SiteNewScreen,
  // Report: ReportScreen,
  SoftwareUpdate: SoftwareUpdateScreen,
  Diagnostics: DiagnosticsScreen,
  Account: ConfigScreen,
  SignOut,
};

const SiteStack = createStackNavigator(
  {
    SiteSelected: {
      // screen: SiteTabNav,
      screen: ZoneStack,
      navigationOptions: {
        headerShown: false,
      },
    },
    ...Routes(LoggedInScreens),
  },
  {
    initialRouteName: "SiteManage",
    headerMode: "screen",
  }
);

const drawerRoutes = [
  {
    key: "Job Sites",
    route: "SiteManage",
    icon: Constants.ICON.site,
  },
  {
    key: "Introduction",
    route: "Tutorial",
    icon: Constants.ICON.tutorial,
  },
  {
    key: "New Site Tutorial",
    route: "SiteTutorial",
    icon: Constants.ICON.tutorial,
  },
  {
    key: "Help",
    route: `https://litesense.com.au/?v=${Constants.VERSION}`,
    icon: Constants.ICON.help,
  },
];

const AppDrawer = createDrawerNavigator(
  {
    Tutorial: { screen: TutorialScreen },
    SiteTutorial: { screen: SiteTutorialScreen },
    Site: { screen: SiteStack },
  },
  {
    initialRouteName: "Tutorial",
    contentComponent: (props) => (
      <SideBar drawerItems={drawerRoutes} {...props} />
    ),
  }
);

const AuthStack = createStackNavigator(
  { AuthScreen },
  { headerMode: "none", mode: "modal" }
);
const AppStack = createStackNavigator(
  { AppDrawer },
  { headerMode: "none", mode: "modal" }
);

export default createAppContainer(
  createSwitchNavigator(
    {
      Splash: { screen: SplashScreen },
      Auth: AuthStack,
      App: AppStack,
    },
    {
      initialRouteName: "Splash",
    }
  )
);
