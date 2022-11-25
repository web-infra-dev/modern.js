import type { StateConfig } from './state';
import type { RouterConfig } from './router';

export type { Plugin } from './core';
export type { AppConfig } from './common';
export { isBrowser } from './common';

export type {
  BaseRuntimeContext,
  RuntimeContext,
  BaseTRuntimeContext,
  TRuntimeContext,
} from './runtime-context';

export {
  createApp,
  createPlugin,
  useLoader,
  bootstrap,
  RuntimeReactContext,
  defineConfig,
  registerInit,
  useRuntimeContext,
} from './core';

export { StateConfig, RouterConfig };
