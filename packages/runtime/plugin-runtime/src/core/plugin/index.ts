import { merge } from '@modern-js/runtime-utils/merge';
import { runtime, Plugin, RuntimeConfigContext } from './base';
import { getGlobalRunner, setGlobalRunner } from './runner';

export * from './base';

export interface RuntimeConfig {
  plugins?: Plugin[];
}

function setupConfigContext() {
  const runner = getGlobalRunner();
  const configs = runner.modifyRuntimeConfig();
  RuntimeConfigContext.set(merge({}, ...configs));
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
  setupConfigContext();
  return runner;
}

export function mergeConfig(
  config: Record<string, any>,
  ...otherConfig: Record<string, any>[]
) {
  return merge(config, ...otherConfig);
}
