import { createPlugin } from '@modern-js/runtime-core';
import { useMemo } from 'react';
import { GarfishProvider } from './utils/Context';
import Apps from './utils/apps';
import setExternal from './utils/setExternal';
import { Config } from './typings';

export default ((config: Config) => {
  setExternal();
  const appsInstance = new Apps(config);

  return createPlugin(() => ({
    hoc({ App }, next) {
      appsInstance.run();

      return next({
        App: props => {
          const value = useMemo(
            () => ({
              MApp: appsInstance.getMApp(),
              apps: appsInstance.getApps(),
            }),
            [],
          );

          return (
            <GarfishProvider value={value}>
              <App {...props} />
            </GarfishProvider>
          );
        },
      });
    },
  }));
}) as any;
