// The loading logic of the current component refers to react-loadable https://github.com/jamiebuilds/react-loadable
import path from 'path';
import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish, { interfaces } from 'garfish';
import { withRouter } from '@modern-js/plugin-router';
// import Loadable from 'react-loadable';
import { Manifest, ModulesInfo } from '../useModuleApps';
import { logger, generateSubAppContainerKey } from '../../util';
import { Loadable, MicroProps } from '../loadable';

// type Provider = {
//   render: () => void;
//   destroy: () => void;
//   [SUBMODULE_APP_COMPONENT_KEY]?: React.ComponentType<any>;
// };

export interface AppMap {
  [key: string]: React.FC<any>;
}

function getAppInstance(
  options: typeof Garfish.options,
  appInfo: ModulesInfo[number],
  manifest?: Manifest,
) {
  let locationHref = '';
  class MicroApp extends React.Component<MicroProps, any> {
    state: {
      appInstance: any;
      domId: string;
    } = {
      appInstance: null,
      domId: generateSubAppContainerKey(appInfo),
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async UNSAFE_componentWillMount() {
      const { match, history, setLoadingState, ...userProps } = this.props;
      const { domId } = this.state;
      const loadAppOptions: Omit<interfaces.AppInfo, 'name'> = {
        ...appInfo,
        domGetter: `#${domId}`,
        basename: path.join(options?.basename || '/', match?.path || '/'),
        cache: true,
        props: {
          ...appInfo.props,
          ...userProps,
        },
        customLoader: provider => {
          const { render, destroy } = provider;
          return {
            mount(...props) {
              logger('MicroApp customer render', props);
              return render?.apply(provider, props);
            },
            unmount(...props) {
              logger('MicroApp customer destroy', props);
              return destroy?.apply(provider, props);
            },
          };
        },
      };

      setLoadingState({
        isLoading: true,
        error: null,
      });

      logger(`MicroApp Garfish.loadApp "${appInfo.name}"`, {
        loadAppOptions,
      });

      try {
        const appInstance = await Garfish.loadApp(appInfo.name, loadAppOptions);
        if (!appInstance) {
          throw new Error(
            `MicroApp Garfish.loadApp "${appInfo.name}" result is null`,
          );
        }

        this.setState({
          appInstance,
        });

        setLoadingState({
          isLoading: false,
        });

        if (appInstance.mounted && appInstance.appInfo.cache) {
          logger(`MicroApp Garfish.loadApp "${appInfo.name}" show`, {
            appInfo: appInstance.appInfo,
            appInstance,
          });
          await appInstance?.show();
        } else {
          logger(`MicroApp Garfish.loadApp "${appInfo.name}" mount`, {
            appInfo: appInstance.appInfo,
            appInstance,
          });
          await appInstance?.mount();
        }
        history?.listen(() => {
          if (locationHref !== history.location.pathname) {
            locationHref = history.location.pathname;
            const popStateEvent = new PopStateEvent('popstate');
            dispatchEvent(popStateEvent);
            logger(`MicroApp Garfish.loadApp popstate`);
          }
        });
      } catch (error) {
        setLoadingState({
          isLoading: true,
          error,
        });
      }
    }

    async componentWillUnmount() {
      const { appInstance } = this.state;
      if (appInstance) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const { appInfo } = appInstance;
        if (appInfo.cache) {
          logger(`MicroApp Garfish.loadApp "${appInfo.name}" hide`);
          appInstance?.hide();
        } else {
          logger(`MicroApp Garfish.loadApp "${appInfo.name}" unmount`);
          appInstance?.unmount();
        }
      }
    }

    render() {
      const { domId } = this.state;
      return (
        <>
          <div id={domId}></div>
        </>
      );
    }
  }

  return Loadable(withRouter(MicroApp as any))(manifest?.loadable);
}

export function generateApps(
  options: typeof Garfish.options,
  manifest?: Manifest,
): {
  apps: AppMap;
  appInfoList: ModulesInfo;
} {
  const apps: AppMap = {};
  options.apps?.forEach(appInfo => {
    const Component = getAppInstance(options, appInfo, manifest);
    (appInfo as any).Component = Component;
    apps[appInfo.name] = Component as any;
  });

  return { apps, appInfoList: options.apps || [] };
}
