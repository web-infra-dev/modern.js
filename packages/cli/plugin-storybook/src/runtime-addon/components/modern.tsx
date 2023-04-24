import React from 'react';
import { createApp } from '@modern-js/runtime';
import type { Plugin, RouterConfig } from '@modern-js/runtime';
import router from '@modern-js/runtime/router';
import state from '@modern-js/runtime/model';
import type { StoryFn as StoryFunction } from '@storybook/addons';
import type { IConfig } from '../type';

export const WrapProviders = (
  storyFn: StoryFunction<JSX.Element>,
  config: IConfig,
) => React.createElement(_createApp(storyFn, config));

const _createApp = (StoryFn: StoryFunction<JSX.Element>, options: IConfig) => {
  const AppWrapper = createApp({
    plugins: resolvePlugins(options.modernConfigRuntime),
  })(StoryFn);

  return AppWrapper;
};
const allowedRuntimeAPI = {
  router: 'router',
  state: 'state',
};
const allowedRuntimeAPIValues = Object.values(allowedRuntimeAPI);

export const resolvePlugins = (runtime: IConfig['modernConfigRuntime']) => {
  const plugins: Plugin[] = [];

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
        // TODO: React Router v6 is not supported yet
        plugins.push(
          router({
            ...{ serverBase: ['/'] },
            ...(runtime.router as RouterConfig),
          }),
        );
      }
    }
  });

  return plugins;
};
