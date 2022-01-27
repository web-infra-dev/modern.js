import { createPlugin } from '@modern-js/runtime-core';
import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { GarfishProvider } from './utils/Context';
import setExternal from './utils/setExternal';
import { Config, Manifest, ModulesInfo, Options } from './useModuleApps';
import { generateMApp } from './utils/MApp';
import { AppMap, generateApps } from './utils/apps';

async function initOptions(manifest: Manifest = {}, options: Options) {
  let modules: ModulesInfo = [];

  // get inject modules list
  if (window?.modern_manifest?.modules) {
    modules = window?.modern_manifest?.modules;
  }

  // use manifest modules
  if (manifest?.modules) {
    modules = manifest?.modules;
  }

  // get module list
  if (manifest?.getAppList) {
    modules = await manifest?.getAppList();
  }

  return {
    apps: modules,
    ...options,
  };
}

export default ((config: Config) => {
  setExternal();
  const { manifest = {}, ...GarfishOptions } = config;
  const promise = initOptions(manifest, GarfishOptions);

  return createPlugin(() => ({
    hoc({ App }, next) {
      class GetMicroFrontendApp extends React.Component {
        state: {
          MApp: React.FC<any>;
          apps: AppMap;
          appInfoList: ModulesInfo;
        } = {
          MApp: () => React.createElement('div'),
          apps: new Proxy(
            {},
            {
              get(_target, _p) {
                return () => React.createElement('div');
              },
            },
          ),
          appInfoList: [],
        };

        constructor(props: any) {
          super(props);
          const load = async () => {
            const GarfishConfig = await promise;
            const MApp = generateMApp(GarfishConfig, manifest);
            const { appInfoList, apps } = generateApps(GarfishConfig, manifest);
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
