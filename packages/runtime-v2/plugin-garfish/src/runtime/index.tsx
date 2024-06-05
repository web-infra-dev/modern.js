import { Plugin } from '@modern-js/runtime-v2';
import GarfishInstance from 'garfish';
import React, { useEffect } from 'react';
import { logger } from '../utils';
import { Config, MicroComponentProps, ModulesInfo } from './useModuleApps';
import { GarfishProvider } from './utils/Context';
import { initOptions } from './utils/initOptions';
import { AppMap, generateApps } from './utils/apps';
import { generateMApp } from './utils/MApp';
import setExternal from './utils/setExternal';

export * from './utils';
export * from './provider';

export { useModuleApps, useModuleApp } from './useModuleApps';
export type { Manifest, ModuleInfo, Config } from './useModuleApps';
export { default as Garfish, default as garfish } from 'garfish';

export type GarfishConfig = Config;

export const garfishPlugin = (config: GarfishConfig): Plugin => {
  return {
    name: '@modern-js/plugin-garfish',
    setup: () => {
      setExternal();

      const { manifest, ...options } = config;
      logger('createPlugin', config);
      const promise = initOptions(manifest, options);
      return {
        hoc({ App, config }, next) {
          const getMicroFrontendApp = () => {
            return (props: any) => {
              const [contextValue, setContextValue] = React.useState<{
                MApp: React.FC<MicroComponentProps>;
                apps: AppMap;
                appInfoList: ModulesInfo;
              }>({
                MApp: () => {
                  logger('MApp init Component Render');
                  return React.createElement('div');
                },
                apps: new Proxy(
                  {},
                  {
                    get() {
                      return () => React.createElement('div');
                    },
                  },
                ),
                appInfoList: [],
              });
              const load = async () => {
                GarfishInstance.setOptions({
                  ...options,
                  insulationVariable: [
                    ...(options.insulationVariable || []),
                    '_SERVER_DATA',
                  ],
                  apps: [],
                });
                const GarfishConfig = await promise;
                const { appInfoList, apps } = generateApps(
                  GarfishConfig,
                  manifest,
                );
                GarfishInstance.registerApp(appInfoList);
                const MApp = generateMApp(GarfishConfig, manifest);
                logger('initOptions result', { manifest, GarfishConfig });
                logger('generateApps', { MApp, apps, appInfoList });
                setContextValue({
                  MApp,
                  apps,
                  appInfoList,
                });
              };
              useEffect(() => {
                load();
              }, []);
              return (
                <GarfishProvider value={contextValue}>
                  <App {...props} />
                </GarfishProvider>
              );
            };
          };
          return next({
            App: getMicroFrontendApp(),
            config,
          });
        },
      };
    },
  };
};

export default garfishPlugin;
