export * from './wrap';
export * from './render';
export * from './initial';

export {
  createPlugin,
  createRuntime,
  runtime,
  registerInit,
  registerPrefetch,
} from './plugin';

export type { Plugin } from './plugin';

export {
  defineConfig,
  getConfig,
  // rename for distinguish with cli config
  getConfig as getAppConfig,
  defineConfig as defineAppConfig,
} from './app-config';
export type { RuntimeConfig as AppConfig } from '@modern-js/core';

// compatible
export * from './compatible';

export type { TRuntimeContext, RuntimeContext } from './runtime-context';
export { RuntimeReactContext } from './runtime-context';
export * from './loader';

export * from '@modern-js/plugin';
