import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
import { Manifest, ModulesInfo } from '../useModuleApps';
import { logger, generateSubAppContainerKey } from '../../util';
import { Loadable, MicroProps } from '../loadable';

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
        ...otherOptions
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
        ...otherOptions,
        insulationVariable: [
          ...(otherOptions.insulationVariable || []),
          '_SERVER_DATA',
        ],
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

    render() {
      return <div id={generateSubAppContainerKey()}></div>;
    }
  }

  return Loadable(MApp)(manifest?.loadable);
}
