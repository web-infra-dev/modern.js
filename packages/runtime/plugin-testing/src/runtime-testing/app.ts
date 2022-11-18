import React from 'react';
import { createApp } from '@modern-js/runtime';
import type { CliUserConfig } from '@modern-js/core';
import { MODERNJS_CONFIG_KEY } from '../constant';
import resolvePlugins from './resolvePlugins';

interface CreateAppProps {
  entry?: string;
  children?: React.ReactElement;
}

class ModernRuntime {
  private options: CliUserConfig<{
    userConfig: { runtime?: any; runtimeByEntries?: any };
  }>;

  constructor(
    options: CliUserConfig<{
      userConfig: { runtime?: any; runtimeByEntries?: any };
    }>,
  ) {
    this.options = options;
  }

  public init(
    options: CliUserConfig<{
      userConfig: { runtime?: any; runtimeByEntries?: any };
    }>,
  ) {
    this.options = options;
  }

  public createApp(props?: CreateAppProps) {
    const { entry, children } = props || {};
    let runtimeFeatures = this.options?.runtime;

    if (entry) {
      runtimeFeatures = {
        ...(runtimeFeatures || {}),
        ...this.options.runtimeByEntries?.[entry],
      };
    }

    const Component = (): React.ReactElement | null => {
      if (!children) {
        return null;
      }

      return children;
    };

    return createApp({
      plugins: resolvePlugins(runtimeFeatures || {}),
    })(Component);
  }
}

export default new ModernRuntime((global as any)[MODERNJS_CONFIG_KEY] || {});
