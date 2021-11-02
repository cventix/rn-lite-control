//
// File: components/Settings/index.js
//
import React from 'react';
import { SafeAreaView } from 'react-native';
import _ from 'lodash';
import Settings from './Settings';

function settingsHOC(WrappedComponent) {
  return class SettingsHOC extends React.Component {
    static hasSettings = true;
    static title = WrappedComponent.title;

    constructor(props) {
      super(props);
      this.state = {
        showSettings: false,
        schema: null,
      };
    }

    componentDidMount() {
      this.props.navigation.setParams({
        settingsPress: () => this.onSettingPress(),
      });
    }

    onSettingPress = () => {
      this.setState({ showSettings: !this.state.showSettings });
    };

    //
    // If the object is a function we do not want to compare it
    // so this will return true for the _.isEqualWith call in proc.
    //
    trueIfFunc = (objValue, othValue) => {
      if (typeof objValue === 'function') {
        return true;
      }
    };

    proc(wrappedComponentInstance) {
      if (wrappedComponentInstance && wrappedComponentInstance.settingsSchema) {
        const schema = wrappedComponentInstance.settingsSchema();
        if (!_.isEqualWith(schema, this.state.schema, this.trueIfFunc)) {
          this.setState({ schema });
        }
      }
    }

    render() {
      const props = Object.assign({}, this.props, { ref: this.proc.bind(this) });

      return (
        <SafeAreaView style={{ flex: 1 }}>
          <Settings
            visible={this.state.showSettings}
            config={this.state.schema}
            onClose={this.onSettingPress}
          />
          <WrappedComponent {...props} />
        </SafeAreaView>
      );
    }
  };
}

export default settingsHOC;
