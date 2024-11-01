import type { CLIPluginAPI } from './types/api';
import type { InternalContext } from './types/context';
import type { PluginManager } from './types/plugin';

export function initPluginAPI({
  context,
}: {
  context: InternalContext;
  pluginManager: PluginManager;
}): CLIPluginAPI {
  const { hooks } = context;
  function getAppContext() {
    if (context) {
      // TODO public App Context
      return {};
    }
    throw new Error('Cannot access context');
  }

  function getConfig() {
    if (context.config) {
      return context.config;
    }
    throw new Error('Cannot access config');
  }
  function getNormalizedConfig() {
    if (context.normalizedConfig) {
      return context.normalizedConfig;
    }
    throw new Error('Cannot access normalized config');
  }

  return {
    getAppContext,
    getConfig,
    getNormalizedConfig,
    modifyRsbuildConfig: hooks.modifyRsbuildConfig.tap,
    modifyBundlerChain: hooks.modifyBundlerChain.tap,
    modifyRspackConfig: hooks.modifyRspackConfig.tap,
    modifyWebpackChain: hooks.modifyWebpackChain.tap,
    // modifyWebpackConfig: hooks.modifyWebpackConfig.tap,
  };
}
