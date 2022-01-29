import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
import { Manifest, ModulesInfo } from '../useModuleApps';
import { logger } from '../../util';
import { generateSubAppContainerKey } from './constant';

declare global {
  interface Window {
    modern_manifest?: {
      modules: ModulesInfo;
    };
  }
}

export function RenderLoading(
  isLoading: boolean,
  { LoadingComponent }: Manifest,
) {
  if (!isLoading) {
    return null;
  }

  if (typeof LoadingComponent === 'function') {
    return <LoadingComponent />;
  }

  return LoadingComponent;
}

export function generateMApp(
  options: typeof Garfish.options,
  { LoadingComponent }: Manifest,
) {
  return class MApp extends React.Component {
    state: {
      loading: boolean;
      domId: string;
    } = {
      loading: false,
      domId: generateSubAppContainerKey(),
    };

    componentDidMount() {
      const { domId } = this.state;
      // start auto render able
      Garfish.router.setRouterConfig({ listening: true });
      const garfishOptions = {
        domGetter: `#${domId}`,
        ...options,
      };
      logger('MApp componentDidMount', {
        garfishRunning: Garfish.running,
        garfishOptions,
      });

      if (!Garfish.running) {
        // Garfish.usePlugin(() => ({
        //   name: 'ModernLifeCycle',
        //   beforeLoad: () => {
        //     // this.setState({
        //     //   loading: true,
        //     // });
        //   },
        //   beforeMount: () => {
        //     // this.setState({
        //     //   loading: false,
        //     // });
        //   },
        // }));
        Garfish.run(garfishOptions);
      }
    }

    componentWillUnmount() {
      // close auto render able
      Garfish.router.setRouterConfig({ listening: false });
      this.setState({
        loading: false,
      });
      logger('MApp componentWillUnmount');
    }

    render() {
      const { loading } = this.state;
      logger('MApp render status', { loading, LoadingComponent });
      return (
        <>
          <div id={generateSubAppContainerKey()}>
            {loading && typeof LoadingComponent === 'function' && (
              <LoadingComponent />
            )}
          </div>
        </>
      );
    }
  };
}
