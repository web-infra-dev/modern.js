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

export { default as useLoader } from './loader/useLoader';

export * from '@modern-js/plugin';
