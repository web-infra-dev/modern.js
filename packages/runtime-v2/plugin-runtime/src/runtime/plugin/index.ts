import { runtime, Plugin } from './base';
import { setGlobalRunner } from './runner';

export { type PluginRunner, type Plugin, runtime } from './base';
interface RuntimeConfig {
  plugins: Plugin[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CLIRuntimeConfig {}
// TODO
export function mergeRuntimeConfig(
  runtimeConfig: RuntimeConfig,
  _CLIRuntimeConfig: CLIRuntimeConfig,
) {
  return runtimeConfig;
}

export function registerPlugin(runtimeConfig: RuntimeConfig) {
  const { plugins } = runtimeConfig;
  runtime.usePlugin(...plugins);
  const runner = runtime.init();
  // It is necessary to execute init after usePlugin, so that the plugin can be registered successfully.
  setGlobalRunner(runner);
}
