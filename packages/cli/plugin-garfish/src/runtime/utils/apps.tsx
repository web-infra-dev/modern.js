import path from 'path';
import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
import { withRouter } from '@modern-js/plugin-router';
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
  const AppComponentMaps: any = {};
  class App extends React.Component<any, any> {
    appInstance: any;

    _isMounted: boolean = false;

    state: {
      loading: boolean;
      domId: string;
      MicroApp: React.ComponentType<any> | null;
    } = {
      loading: true,
      domId: generateSubAppContainerKey(appInfo),
      MicroApp: AppComponentMaps[appInfo.name],
    };

    async componentWillMount() {
      this._isMounted = true;
      const { domId } = this.state;
      this.setState({
        loading: true,
      });

      // ignore withRouter props
      const { history, location, match, staticContext, ...userProps } =
        this.props;
      const { options } = Garfish;
      const app = await Garfish.loadApp(appInfo.name, {
        ...appInfo,
        domGetter: `#${domId}`,
        basename: path.join(
          options?.basename || '/',
          // eslint-disable-next-line react/destructuring-assignment
          this.props?.match?.path,
        ),
        cache: true,
        props: {
          ...appInfo.props,
          ...userProps,
        },
        // eslint-disable-next-line consistent-return
        customLoader: (provider, nAppInfo) => {
          const AppComponent =
            (provider as Provider)[SUBMODULE_APP_COMPONENT_KEY] ||
            (provider as Provider)[JUPITER_SUBMODULE_APP_COMPONENT_KEY];

          if (AppComponent && !AppComponentMaps[appInfo.name]) {
            return {
              mount: () => {
                // in the unmount state can't change state
                if (this._isMounted) {
                  const nAppComponent = () => (
                    <AppComponent
                      appName={nAppInfo.name}
                      basename={nAppInfo.basename}
                      props={nAppInfo.props}
                    />
                  );
                  AppComponentMaps[appInfo.name] = nAppComponent;
                  this.setState({
                    MicroApp: nAppComponent,
                  });
                }
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

      if (!app) {
        throw new Error(
          `${appInfo.name} loaded error, appInfo: ${JSON.stringify(
            appInfo,
          )}, options: ${JSON.stringify(options)}`,
        );
      }

      this.appInstance = app;

      if (app?.mounted) {
        await app?.show();
      } else {
        await app?.mount();
      }
      this.setState({
        loading: false,
      });
    }

    componentWillUnmount() {
      this._isMounted = false;
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
  return withRouter(App);
}

export function generateApps(
  options: typeof Garfish.options,
  modernMicroConfig: ModernConfig,
): {
  apps: AppMap;
  appInfoList: ModulesInfo;
} {
  const apps: AppMap = {};
  options.apps?.forEach(appInfo => {
    const Component = getAppInstance(appInfo, modernMicroConfig);
    appInfo.Component = Component;
    apps[appInfo.name] = Component;
  });

  return { apps, appInfoList: options.apps || [] };
}
