import { createPlugin } from '@modern-js/runtime-core';
import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { GarfishProvider } from './utils/Context';
import setExternal from './utils/setExternal';
import { Config, ModulesInfo, Options } from './typings';
import { generateMApp } from './utils/MApp';
import { AppMap, generateApps } from './utils/apps';

async function initOptions(config: Config, options: Options) {
  let modules: ModulesInfo = [];

  // get inject modules list
  if (window?.modern_manifest?.modules) {
    modules = window?.modern_manifest?.modules;
  }

  // use manifest modules
  if (config?.manifest?.modules) {
    modules = config?.manifest?.modules;
  }

  // get module list
  if (config?.getAppList) {
    modules = await config?.getAppList();
  }

  return {
    apps: modules,
    ...options,
  };
}

export default ((config: Config) => {
  setExternal();
  const { manifest, getAppList, LoadingComponent, ...GarfishOptions } = config;
  const ModernMicroConfig = {
    manifest,
    getAppList,
    LoadingComponent,
  };
  const promise = initOptions(config, GarfishOptions);

  return createPlugin(() => ({
    hoc({ App }, next) {
      class GetMicroFrontendApp extends React.Component {
        state: {
          MApp: React.FC<any>;
          apps: AppMap;
          appInfoList: ModulesInfo;
        } = {
          MApp: () => React.createElement('div'),
          apps: {},
          appInfoList: [],
        };

        constructor(props: any) {
          super(props);
          const load = async () => {
            const GarfishConfig = await promise;
            const MApp = generateMApp(GarfishConfig, ModernMicroConfig);
            const { appInfoList, apps } = generateApps(
              GarfishConfig,
              ModernMicroConfig,
            );
            this.setState({
              MApp,
              apps,
              appInfoList,
            });
          };
          load();
        }

        render() {
          return (
            <GarfishProvider value={this.state}>
              <App {...this.props} {...this.state} />
            </GarfishProvider>
          );
        }
      }

      return next({
        App: hoistNonReactStatics(GetMicroFrontendApp, App),
      });
    },
  }));
}) as any;
