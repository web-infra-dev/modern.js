import React, { memo, useEffect, useState } from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish, { interfaces as GarfishInterfaces } from 'garfish';
import { ModernConfig, ModulesInfo } from '../typings';
import {
  generateSubAppContainerKey,
  JUPITER_SUBMODULE_APP_COMPONENT_KEY,
  SUBMODULE_APP_COMPONENT_KEY,
} from './constant';
import { RenderLoading } from './MApp';

type Provider = {
  render: () => void;
  destroy: () => void;
  [SUBMODULE_APP_COMPONENT_KEY]?: React.ComponentType<any>;
  [JUPITER_SUBMODULE_APP_COMPONENT_KEY]?: React.ComponentType<any>;
};

declare module 'garfish' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace interfaces {
    export interface AppInfo {
      Component: () => JSX.Element;
    }
  }
}

export interface AppMap {
  [key: string]: ReturnType<typeof getAppInstance>;
}

function getAppInstance(
  appInfo: GarfishInterfaces.AppInfo,
  modernMicroConfig: ModernConfig,
) {
  return function App() {
    const domID = generateSubAppContainerKey();
    const [loading, setLoading] = useState(false);
    const [ModuleApp, setModuleApp] = useState<React.ComponentType<any> | null>(
      null,
    );

    useEffect(() => {
      async function load() {
        const { name, ...options } = appInfo;
        setLoading(true);
        const app = await Garfish.loadApp(name, {
          domGetter: domID,
          // eslint-disable-next-line consistent-return
          customLoader(provider) {
            const AppComponent =
              (provider as Provider)[SUBMODULE_APP_COMPONENT_KEY] ||
              (provider as Provider)[JUPITER_SUBMODULE_APP_COMPONENT_KEY];

            if (AppComponent && setModuleApp) {
              return {
                mount() {
                  setModuleApp(() =>
                    memo((props: any) => (
                      <AppComponent {...appInfo.props} {...props} />
                    )),
                  );
                },
                unmount() {
                  setModuleApp(null);
                },
              };
            }
          },
          ...options,
        });

        // If the show has been rendered and triggered, only the first rendering triggers mount, and subsequent renderings can trigger show to provide performance
        try {
          if (app?.mounted) {
            app.show();
          } else {
            await app?.mount();
          }
        } finally {
          setLoading(false);
        }

        return () => app?.hide();
      }
      load();
    }, []);
    return (
      <>
        {RenderLoading(loading, modernMicroConfig)}
        <div id={domID}>{ModuleApp && <ModuleApp />}</div>
      </>
    );
  };
}

export function generateApps(
  options: typeof Garfish.options,
  modernMicroConfig: ModernConfig,
): {
  apps: AppMap;
  appInfoList: ModulesInfo;
} {
  options.apps?.forEach(appInfo => {
    const Component = getAppInstance(appInfo, modernMicroConfig);
    appInfo.Component = Component;
  });

  const apps: AppMap = {};
  options.apps?.reduce((res, appInfo) => {
    if (appInfo.Component) {
      res[appInfo.name] = appInfo.Component;
    }
    return res;
  }, apps);

  return { apps, appInfoList: options.apps || [] };
}
