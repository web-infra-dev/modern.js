import { createPlugin } from '@modern-js/runtime-core';
import { useMemo } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
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

      const getMicroFrontendApp = (props: any) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
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
      };
      return next({
        App: hoistNonReactStatics(getMicroFrontendApp, App),
      });
    },
  }));
}) as any;
