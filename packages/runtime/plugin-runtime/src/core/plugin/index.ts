import { runtime, Plugin } from './base';
import { setGlobalRunner } from './runner';

export * from './base';

export interface RuntimeConfig {
  plugins: Plugin[];
}

export function registerPlugin(
  internalPlugins: Plugin[],
  runtimeConfig?: RuntimeConfig,
  customRuntime?: typeof runtime,
) {
  const { plugins = [] } = runtimeConfig || {};
  (customRuntime || runtime).usePlugin(...internalPlugins, ...plugins);
  const runner = (customRuntime || runtime).init();
  // It is necessary to execute init after usePlugin, so that the plugin can be registered successfully.
  setGlobalRunner(runner);
  return runner;
}
