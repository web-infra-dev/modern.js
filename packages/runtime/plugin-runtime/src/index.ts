import type { RouterConfig } from './router';
import type { StateConfig } from './state';

export type { Plugin, RuntimePluginFuture } from './core';
export type { AppConfig, RuntimeConfig } from './common';
export { isBrowser } from './common';

export type { RuntimeContext } from './core/context/runtime';
export type { RuntimeUserConfig } from './config';

export { getMonitors } from './core/context/monitors';
export { getRequest } from '@modern-js/runtime-utils/universal/request';

export {
  createApp,
  useLoader,
  bootstrap,
  RuntimeReactContext,
  defineConfig,
  defineRuntimeConfig,
  useRuntimeContext,
} from './core';

export type { StateConfig, RouterConfig };
