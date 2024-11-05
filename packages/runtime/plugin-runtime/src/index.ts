import type { RouterConfig } from './router';
import type { StateConfig } from './state';

export type { Plugin } from './core';
export type { AppConfig, RuntimeConfig } from './common';
export { isBrowser } from './common';

export type { RuntimeContext } from './core/context/runtime';
export type { RuntimeUserConfig } from './config';

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
