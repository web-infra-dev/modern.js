export {
  createPlugin,
  createRuntime,
  runtime,
  registerInit,
  registerPrefetch,
} from './plugin';

export type { Plugin } from './plugin';

export { defineConfig, getConfig } from './app-config';

// compatible
export * from './compatible';

export type { TRuntimeContext, RuntimeContext } from '../runtime-context';
export { RuntimeReactContext, ServerRouterContext } from '../runtime-context';
export * from './loader';

export * from '@modern-js/plugin';
