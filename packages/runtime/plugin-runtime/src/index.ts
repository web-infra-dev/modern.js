import type { StateConfig } from './plugins/state';
import type { RouterConfig } from './plugins/router';

export type { Plugin } from './runtime';

export type { RuntimeContext, TRuntimeContext } from './runtime-context';

export * from './common';

export { RuntimeReactContext } from './runtime-context';

export {
  createApp,
  createPlugin,
  useLoader,
  bootstrap,
  registerPrefetch,
  defineConfig,
  registerInit,
  useRuntimeContext,
} from './runtime';

export { StateConfig, RouterConfig };
