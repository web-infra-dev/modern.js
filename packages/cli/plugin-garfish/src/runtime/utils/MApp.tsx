import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
import type { ModulesInfo, ModernConfig } from '../typings';
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
  { LoadingComponent }: ModernConfig,
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
  modernMicroConfig: ModernConfig,
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
      if (!Garfish.running) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        Garfish.usePlugin(() => ({
          name: 'JupiterLifeCycle',
          beforeLoad: () => {
            this.setState({
              loading: true,
            });
          },
          beforeMount: () => {
            this.setState({
              loading: false,
            });
          },
        }));
        Garfish.run({
          domGetter: `#${domId}`,
          ...options,
        });
      }
    }

    componentWillUnmount() {
      // close auto render able
      Garfish.router.setRouterConfig({ listening: false });
      this.setState({
        loading: false,
      });
    }

    render() {
      const { loading } = this.state;
      return (
        <>
          <div id={generateSubAppContainerKey()}>
            {RenderLoading(loading, modernMicroConfig)}
          </div>
        </>
      );
    }
  };
}
