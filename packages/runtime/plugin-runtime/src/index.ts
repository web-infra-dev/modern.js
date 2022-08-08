import type { StateConfig } from './state';
import type { RouterConfig } from './router';

export type {
  Plugin,
  RuntimeContext,
  TRuntimeContext,
  AppConfig,
} from './core';

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
