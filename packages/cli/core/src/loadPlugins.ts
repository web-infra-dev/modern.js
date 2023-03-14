import { InternalPlugins } from '@modern-js/types';
import {
  tryResolve,
  createDebugger,
  compatRequire,
  getInternalPlugins,
  dynamicImport,
} from '@modern-js/utils';
import type {
  CliPlugin,
  UserConfig,
  OldPluginConfig,
  PluginConfig,
  PluginItem,
} from './types';
import { createPlugin } from './manager';

const debug = createDebugger('load-plugins');

const resolveCliPlugin = async (
  p: PluginItem,
  userConfig: UserConfig,
  appDirectory: string,
): Promise<CliPlugin> => {
  const pkg = typeof p === 'string' ? p : p[0];
  const pluginOptions = typeof p === 'string' ? undefined : p[1];
  const path = tryResolve(pkg, appDirectory);
  let module;
  try {
    module = compatRequire(path);
  } catch (e) {
    // load esm module
    ({ default: module } = await dynamicImport(path));
  }

  if (typeof module === 'function') {
    const result: CliPlugin = module(pluginOptions);
    return createPlugin(result.setup, result);
  }

  return module;
};

export const isOldPluginConfig = (
  config?: PluginConfig,
): config is OldPluginConfig =>
  Array.isArray(config) &&
  config.some(item => {
    return typeof item === 'string' || Array.isArray(item);
  });

/**
 * Load internal plugins which in @modern-js scope and user's custom plugins.
 * @param appDirectory - Application root directory.
 * @param userConfig - Resolved user config.
 * @param options.internalPlugins - Internal plugins.
 * @returns Plugin Objects has been required.
 */
export const loadPlugins = async (
  appDirectory: string,
  userConfig: UserConfig,
  options: {
    internalPlugins?: InternalPlugins;
    autoLoad?: InternalPlugins;
    forceAutoLoadPlugins?: boolean;
  } = {},
) => {
  const pluginConfig = userConfig.plugins;
  const plugins = [
    ...(options.forceAutoLoadPlugins || userConfig.autoLoadPlugins
      ? getInternalPlugins(appDirectory, options.internalPlugins)
      : []),
    ...(isOldPluginConfig(pluginConfig) ? pluginConfig : []),
    ...(options.autoLoad
      ? getInternalPlugins(appDirectory, options.autoLoad)
      : []),
  ];

  const loadedPlugins = await Promise.all(
    plugins.map(plugin => {
      const loadedPlugin = resolveCliPlugin(plugin, userConfig, appDirectory);

      // server plugins don't support to accept params
      debug(`resolve plugin %s: %s`, plugin, loadedPlugin);

      return loadedPlugin;
    }),
  );

  if (!isOldPluginConfig(pluginConfig)) {
    if (pluginConfig?.length) {
      loadedPlugins.push(
        ...pluginConfig.map(item => createPlugin(item.setup, item)),
      );
    }
  }

  return loadedPlugins;
};
