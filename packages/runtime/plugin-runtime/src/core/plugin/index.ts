import { runtime, Plugin } from './base';
import { setGlobalRunner } from './runner';

export * from './base';

export interface RuntimeConfig {
  plugins: Plugin[];
}

export function registerPlugin(
  internalPlugins: Plugin[],
  runtimeConfig?: RuntimeConfig,
) {
  const { plugins = [] } = runtimeConfig || {};
  runtime.usePlugin(...internalPlugins, ...plugins);
  const runner = runtime.init();
  // It is necessary to execute init after usePlugin, so that the plugin can be registered successfully.
  setGlobalRunner(runner);
}
