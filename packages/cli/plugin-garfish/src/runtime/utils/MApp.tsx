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
        beforeLoad(...args) {
          logger('MApp beforeLoad', args);
          setLoadingState({
            isLoading: true,
            error: null,
          });
          return beforeLoad?.(...args);
        },
        beforeMount(...args) {
          logger('MApp beforeMount', args);
          setLoadingState({
            isLoading: false,
          });
          return beforeMount?.(...args);
        },
        errorLoadApp(error, ...args) {
          logger('MApp errorLoadApp', error, args);
          setLoadingState({
            error,
          });
          return errorLoadApp?.(error, ...args);
        },
        errorMountApp(error, ...args) {
          logger('MApp errorMountApp', error, args);
          setLoadingState({
            error,
          });
          return errorMountApp?.(error, ...args);
        },
        errorUnmountApp(error, ...args) {
          logger('MApp errorUnmountApp', error, args);
          setLoadingState({
            error,
          });
          return errorUnmountApp?.(error, ...args);
        },
        ...otherOptions,
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
