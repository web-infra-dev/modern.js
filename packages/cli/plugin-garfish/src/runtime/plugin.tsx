import { createPlugin } from '@modern-js/runtime-core';
import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { logger } from '../util';
import { GarfishProvider } from './utils/Context';
import setExternal from './utils/setExternal';
import { Config, Manifest, ModulesInfo, Options } from './useModuleApps';
import { generateMApp } from './utils/MApp';
import { AppMap, generateApps } from './utils/apps';

async function initOptions(manifest: Manifest = {}, options: Options) {
  let apps: ModulesInfo = [];

  // use manifest modules
  if (manifest?.modules) {
    apps = manifest?.modules;
    logger('manifest modules', apps);
  }

  // get module list
  if (manifest?.getAppList) {
    apps = await manifest?.getAppList();
    logger('getAppList modules', apps);
  }

  // get inject modules list
  if (window?.modern_manifest?.modules) {
    apps = window?.modern_manifest?.modules;
    logger('modern_manifest', apps);
  }

  return {
    apps,
    ...options,
  };
}

export default ((config: Config) => {
  setExternal();
  const { manifest = {}, LoadingComponent, ...options } = config;
  logger('createPlugin', { config });
  if (!manifest.LoadingComponent && LoadingComponent) {
    manifest.LoadingComponent = LoadingComponent;
  }

  const promise = initOptions(manifest, options);

  return createPlugin(() => ({
    hoc({ App }, next) {
      class GetMicroFrontendApp extends React.Component {
        state: {
          MApp: React.FC<any>;
          apps: AppMap;
          appInfoList: ModulesInfo;
        } = {
          MApp: () => {
            logger('MApp init Component Render');
            return React.createElement('div');
          },
          apps: new Proxy(
            {},
            {
              get(_target, _p) {
                logger('apps init Component Render', _p);
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
            logger('initOptions result', { manifest, GarfishConfig });
            const MApp = generateMApp(GarfishConfig, manifest);
            const { appInfoList, apps } = generateApps(GarfishConfig, manifest);
            logger('generateApps', { MApp, apps, appInfoList });
            this.setState({
              MApp,
              apps,
              appInfoList,
            });
          };
          load();
        }

        render() {
          logger('GarfishProvider state', this.state);
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
