import type { FederationCliPlugin } from '../types/cli';
import { LEGACY_PLUGINS, resolveActivation } from './activation';

/** Registered by app-tools. MF implementation is loaded only for enabled apps. */
export const builtinModuleFederationPlugin = (): FederationCliPlugin => ({
  name: '@modern-js/builtin-module-federation',
  pre: ['@modern-js/plugin-initialize'],
  post: LEGACY_PLUGINS,
  setup: async api => {
    const { appDirectory } = api.getAppContext();
    const options = resolveActivation(
      api.getConfig().moduleFederation,
      appDirectory,
      api.isPluginExists,
    );
    // Watch the default path even while disabled, so creating the file enables MF.
    api.addWatchFiles(() => [options.watchPath]);
    if (!options.enabled) return;
    try {
      require.resolve('@module-federation/enhanced/rspack', {
        paths: [appDirectory],
      });
    } catch {
      throw new Error(
        '[Modern.js Module Federation] Install @module-federation/enhanced to enable built-in Module Federation.',
      );
    }
    const { moduleFederationPlugin } = await import('./plugin');
    const plugin = moduleFederationPlugin(options.config);
    // Preserve the legacy config → bundler → SSR setup order without registering
    // legacy plugin names or importing MF in ordinary Modern applications.
    await plugin.usePlugins![0].setup!(api);
    await plugin.setup!(api);
    await plugin.usePlugins![1].setup!(api);
  },
});
export default builtinModuleFederationPlugin;
export type { ModuleFederationConfig, PluginOptions } from '../types';
