import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
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
      Component: React.ComponentType;
    }
  }
}

export interface AppMap {
  [key: string]: React.ComponentType;
}

function getAppInstance(
  appInfo: ModulesInfo[number],
  modernMicroConfig: ModernConfig,
) {
  class App extends React.Component<any, any> {
    appInstance: any;

    state: {
      loading: boolean;
      domId: string;
      MicroApp: React.ComponentType<any> | null;
    } = {
      loading: true,
      domId: generateSubAppContainerKey(appInfo),
      MicroApp: null,
    };

    async componentDidMount() {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({
        loading: true,
      });

      const { domId } = this.state;
      const app = await Garfish.loadApp(appInfo.name, {
        domGetter: `#${domId}`,
        basename: appInfo.activeWhen as string,
        cache: true,
        ...appInfo,
        // eslint-disable-next-line consistent-return
        customLoader: provider => {
          const AppComponent =
            (provider as Provider)[SUBMODULE_APP_COMPONENT_KEY] ||
            (provider as Provider)[JUPITER_SUBMODULE_APP_COMPONENT_KEY];

          if (AppComponent) {
            return {
              mount: () => {
                this.setState({
                  MicroApp: AppComponent,
                });
              },
              unmount: () => {
                this.setState({
                  MicroApp: null,
                });
              },
            };
          }
        },
      });

      this.appInstance = app;

      if (app?.mounted) {
        await app?.show();
      } else {
        await app?.mount();
      }

      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({
        loading: false,
      });
    }

    componentWillUnmount() {
      if (this.appInstance) {
        this.appInstance.hide();
      }
    }

    render() {
      const { MicroApp, domId, loading } = this.state;
      return (
        <>
          <div id={domId}>
            {RenderLoading(loading, modernMicroConfig)}
            {MicroApp && <MicroApp />}
          </div>
        </>
      );
    }
  }
  return App;
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
