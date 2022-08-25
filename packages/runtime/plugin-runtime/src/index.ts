import type { StateConfig } from './state';
import type { RouterConfig } from './router';

export type { Plugin, AppConfig } from './core';

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
  registerPrefetch,
  defineConfig,
  registerInit,
  useRuntimeContext,
} from './core';

export { StateConfig, RouterConfig };
declare module './core' {
  interface AppConfig {
    router?: RouterConfig | boolean;
    state?: StateConfig | boolean;
  }
}
