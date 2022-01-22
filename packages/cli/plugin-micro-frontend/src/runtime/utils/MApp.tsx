import React, { useEffect, useState } from 'react';
// eslint-disable-next-line import/no-named-as-default
import Garfish from 'garfish';
import type { Config, ModulesInfo, Options, ModernConfig } from '../typings';
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

export async function initOptions(config: Config, options: Options) {
  let modules: ModulesInfo = [];

  // get inject modules list
  if (window?.modern_manifest?.modules) {
    modules = window?.modern_manifest?.modules;
  }

  // use manifest modules
  if (config?.manifest?.modules) {
    modules = config?.manifest?.modules;
  }

  // get module list
  if (config?.getAppList) {
    modules = await config?.getAppList();
  }

  return {
    apps: modules,
    ...options,
  };
}

export function generateMApp(
  options: typeof Garfish.options,
  modernMicroConfig: ModernConfig,
): React.FC<any> {
  const Component = function (props: any) {
    const [loading, setLoading] = useState(false);
    const domId = generateSubAppContainerKey();

    Garfish.usePlugin(() => ({
      name: 'JupiterLifeCycle',
      beforeLoad() {
        setLoading(true);
      },
      beforeMount() {
        setLoading(false);
      },
    }));

    useEffect(() => {
      if (!Garfish.running) {
        Garfish.run({
          domGetter: `#${domId}`,
          props: {
            ...props,
          },
          ...options,
        });
      }
    }, []);

    return (
      <>
        <div id={generateSubAppContainerKey()}></div>
        {RenderLoading(loading, modernMicroConfig)}
      </>
    );
  };
  return Component;
}
