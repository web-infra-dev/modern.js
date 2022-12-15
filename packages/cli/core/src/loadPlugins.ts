import { InternalPlugins } from '@modern-js/types';
import {
  tryResolve,
  createDebugger,
  compatRequire,
  getInternalPlugins,
  dynamicImport,
} from '@modern-js/utils';
import { INTERNAL_APP_TOOLS_RUNTIME_PLUGINS } from '@modern-js/utils/constants';
import type {
  CliPlugin,
  UserConfig,
  OldPluginConfig,
  PluginConfig,
  PluginItem,
  ToolsType,
} from './types';
import { createPlugin } from './manager';

const debug = createDebugger('load-plugins');

export type TransformPlugin = (
  plugin: PluginConfig,
  resolvedConfig: UserConfig,
  pluginOptions?: any,
) => PluginConfig;

const resolveCliPlugin = async (
  p: PluginItem,
  userConfig: UserConfig,
  appDirectory: string,
  transformPlugin?: TransformPlugin,
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
  if (transformPlugin) {
    module = transformPlugin(module, userConfig, pluginOptions);
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
 * @param options.transformPlugin - transform plugin before using it. Used for compatible with legacy jupiter plugins.
 * @returns Plugin Objects has been required.
 */
export const loadPlugins = async (
  appDirectory: string,
  userConfig: UserConfig,
  options: {
    internalPlugins?: InternalPlugins;
    transformPlugin?: TransformPlugin;
    toolsTypes?: ToolsType;
    forceAutoLoadPlugins?: boolean;
  } = {},
) => {
  const pluginConfig = userConfig.plugins;
  const plugins = [
    ...(options.forceAutoLoadPlugins || userConfig.autoLoadPlugins
      ? getInternalPlugins(appDirectory, options.internalPlugins)
      : []),
    ...(isOldPluginConfig(pluginConfig) ? pluginConfig : []),
    ...(options.toolsTypes === 'app-tools'
      ? getInternalPlugins(appDirectory, INTERNAL_APP_TOOLS_RUNTIME_PLUGINS)
      : []),
  ];

  const loadedPlugins = await Promise.all(
    plugins.map(plugin => {
      const loadedPlugin = resolveCliPlugin(
        plugin,
        userConfig,
        appDirectory,
        options.transformPlugin,
      );

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
