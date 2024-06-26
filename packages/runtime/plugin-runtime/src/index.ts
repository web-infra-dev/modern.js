import type { StateConfig } from './state';
import type { RouterConfig } from './router';

export type { Plugin } from './core';
export type { AppConfig } from './common';
export { isBrowser } from './common';

export type {
  BaseRuntimeContext,
  RuntimeContext,
  BaseTRuntimeContext,
} from './core/context/runtime';
export type { RuntimeUserConfig } from './config';
export { createRoot } from './core/react';
export { render } from './core/browser';
export {
  createApp,
  useLoader,
  bootstrap,
  RuntimeReactContext,
  defineConfig,
  defineRuntimeConfig,
  useRuntimeContext,
} from './core';

export { StateConfig, RouterConfig };
