import state from '@modern-js/plugin-state/runtime';
import { createApp } from '@modern-js/runtime';
import type {
  Plugin,
  RouterConfig,
  RuntimePluginFuture,
} from '@modern-js/runtime';
import router from '@modern-js/runtime/router/internal';
import React from 'react';
import type { IConfig } from '../type';

export const WrapProviders = (storyFn: any, config: IConfig) => {
  const App = createApp({
    plugins: resolvePlugins(config.modernConfigRuntime),
  })(storyFn);

  return <App />;
};

const allowedRuntimeAPI = {
  router: 'router',
  state: 'state',
};
const allowedRuntimeAPIValues = Object.values(allowedRuntimeAPI);

export const resolvePlugins = (runtime: IConfig['modernConfigRuntime']) => {
  const plugins: (Plugin | RuntimePluginFuture)[] = [];

  if (!runtime) {
    return plugins;
  }

  Object.keys(runtime).forEach(api => {
    if (allowedRuntimeAPIValues.includes(api)) {
      if (api === allowedRuntimeAPI.state) {
        if (typeof runtime.state === 'boolean') {
          if (runtime.state) {
            plugins.push(state({}));
          }
        } else if (typeof runtime.state === 'object') {
          plugins.push(state(runtime.state));
        }
      } else if (api === allowedRuntimeAPI.router) {
        plugins.push(
          router({
            ...{ serverBase: ['/'] },
            ...(runtime.router as RouterConfig),
          }) as RuntimePluginFuture,
        );
      }
    }
  });

  return plugins;
};
