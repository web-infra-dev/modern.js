import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
import { Manifest, ModulesInfo } from '../useModuleApps';
import { logger, generateSubAppContainerKey } from '../../util';
import { Loadable, MicroProps } from '../loadable';
import { Provider } from './apps';

declare global {
  interface Window {
    modern_manifest?: {
      modules: ModulesInfo;
    };
  }
}

export function generateMApp(
  options: typeof Garfish.options,
  manifest?: Manifest,
) {
  class MApp extends React.Component<MicroProps, any> {
    state: {
      domId: string;
      SubModuleComponent?: React.ComponentType<any>;
    } = {
      domId: generateSubAppContainerKey(),
    };

    componentDidMount() {
      const { domId } = this.state;
      const { setLoadingState } = this.props;
      const {
        beforeLoad,
        beforeMount,
        errorLoadApp,
        errorMountApp,
        errorUnmountApp,
      } = options;

      // start auto render able
      Garfish.router.setRouterConfig({ listening: true });

      const garfishOptions: typeof Garfish.options = {
        domGetter: `#${domId}`,
        beforeLoad(appInfo, ...args) {
          logger('MApp beforeLoad', [appInfo]);
          if (appInfo.activeWhen) {
            setLoadingState({
              isLoading: true,
              error: null,
            });
          }
          return beforeLoad?.(appInfo, ...args);
        },
        beforeMount(appInfo, ...args) {
          logger('MApp beforeMount', args);
          if (appInfo.activeWhen) {
            setLoadingState({
              isLoading: false,
            });
          }
          return beforeMount?.(appInfo, ...args);
        },
        errorLoadApp(error, appInfo, ...args) {
          logger('MApp errorLoadApp', error, args);
          if (appInfo.activeWhen) {
            setLoadingState({
              error,
            });
          }
          return errorLoadApp?.(error, appInfo, ...args);
        },
        errorMountApp(error, appInfo, ...args) {
          logger('MApp errorMountApp', error, args);
          if (appInfo.activeWhen) {
            setLoadingState({
              error,
            });
          }
          return errorMountApp?.(error, appInfo, ...args);
        },
        errorUnmountApp(error, appInfo, ...args) {
          logger('MApp errorUnmountApp', error, args);
          if (appInfo.activeWhen) {
            setLoadingState({
              error,
            });
          }
          return errorUnmountApp?.(error, appInfo, ...args);
        },
        customLoader: (provider: Provider) => {
          const {
            render,
            destroy,
            SubModuleComponent,
            jupiter_submodule_app_key,
          } = provider;
          const componetRenderMode =
            manifest?.componentRender &&
            (SubModuleComponent || jupiter_submodule_app_key);
          return {
            mount: appInfo => {
              const transferProps = this.filterTransferProps();
              appInfo.props = { ...appInfo.props, ...transferProps };
              if (componetRenderMode) {
                this.setState({
                  SubModuleComponent:
                    SubModuleComponent ?? jupiter_submodule_app_key,
                });
                return undefined;
              } else {
                logger('MicroApp customer render', appInfo);
                return render?.apply(provider, [appInfo]);
              }
            },
            unmount: appInfo => {
              const transferProps = this.filterTransferProps();
              appInfo.props = { ...appInfo.props, ...transferProps };
              if (componetRenderMode) {
                return undefined;
              }
              logger('MicroApp customer destroy', appInfo);
              return destroy?.apply(provider, [appInfo]);
            },
          };
        },
      };

      logger('MApp componentDidMount', {
        garfishRunning: Garfish.running,
        garfishOptions,
      });

      if (!Garfish.running) {
        Garfish.run(garfishOptions);
      }
    }

    componentWillUnmount() {
      // close auto render able
      Garfish.router.setRouterConfig({ listening: false });
      logger('MApp componentWillUnmount');
    }

    filterTransferProps() {
      const { style, setLoadingState, ...others } = this.props;
      return others;
    }

    render() {
      const { style } = this.props;
      const { SubModuleComponent } = this.state;
      return (
        <div style={{ ...style }} id={generateSubAppContainerKey()}>
          {SubModuleComponent && <SubModuleComponent />}
        </div>
      );
    }
  }

  return Loadable(MApp)(manifest?.loadable);
}
