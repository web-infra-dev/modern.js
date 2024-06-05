import { merge } from '@modern-js/utils/lodash';
import { RouterConfig } from '../../router/runtime';
import { runtime, Plugin } from './base';
import { setGlobalRunner } from './runner';

export { type PluginRunner, type Plugin, runtime } from './base';
export interface RuntimeConfig {
  router: RouterConfig;
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

export function mergeConfig(
  cliConfig: Record<string, any>,
  runtimeConfig: Record<string, any>,
  otherConfig: Record<string, any>,
) {
  return merge(cliConfig, runtimeConfig, otherConfig);
}
