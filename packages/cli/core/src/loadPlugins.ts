import {
  tryResolve,
  isDepExists,
  createDebugger,
  compatRequire,
  INTERNAL_PLUGINS,
} from '@modern-js/utils';
import type { UserConfig } from './config';
import { CliPlugin, createPlugin } from './manager';

const debug = createDebugger('load-plugins');

type PluginItem = string | [string, any];

export type LoadedPlugin = {
  cli?: CliPlugin;
  server?: string;
  serverPkg?: string;
};

export type TransformPlugin = (
  plugin: PluginConfig,
  resolvedConfig: UserConfig,
  pluginOptions?: any,
) => PluginConfig;

/**
 * @deprecated
 * Using NewPluginConfig instead.
 */
type OldPluginConfig = Array<
  | PluginItem
  | {
      cli?: PluginItem;
      server?: PluginItem;
    }
>;

type NewPluginConfig =
  | CliPlugin[]
  | {
      cli?: CliPlugin[];
      /** Custom server plugin is not supported yet. */
      server?: never;
    };

export type PluginConfig = OldPluginConfig | NewPluginConfig;

export function getAppPlugins(
  appDirectory: string,
  oldPluginConfig: OldPluginConfig,
  internalPlugins?: typeof INTERNAL_PLUGINS,
) {
  const allPlugins = internalPlugins || INTERNAL_PLUGINS;
  const appPlugins = [
    ...Object.keys(allPlugins)
      .filter(name => {
        const config: any = allPlugins[name];
        if (config.forced === true) {
          return true;
        }
        return isDepExists(appDirectory, name);
      })
      .map(name => allPlugins[name]),
    ...oldPluginConfig,
  ];
  return appPlugins;
}

const resolveCliPlugin = (
  p: PluginItem,
  userConfig: UserConfig,
  appDirectory: string,
  transformPlugin?: TransformPlugin,
): CliPlugin => {
  const pkg = typeof p === 'string' ? p : p[0];
  const pluginOptions = typeof p === 'string' ? undefined : p[1];
  const path = tryResolve(pkg, appDirectory);

  let module = compatRequire(path);
  if (transformPlugin) {
    module = transformPlugin(module, userConfig, pluginOptions);
  }

  if (typeof module === 'function') {
    const result: CliPlugin = module(pluginOptions);
    return createPlugin(result.setup, result);
  }

  return module;
};

const isOldPluginConfig = (config?: PluginConfig): config is OldPluginConfig =>
  Array.isArray(config) &&
  config.some(item => {
    if (typeof item === 'string' || Array.isArray(item)) {
      return true;
    }
    return 'cli' in item || 'server' in item;
  });

/**
 * Load internal plugins which in @modern-js scope and user's custom plugins.
 * @param appDirectory - Application root directory.
 * @param userConfig - Resolved user config.
 * @param options.internalPlugins - Internal plugins.
 * @param options.transformPlugin - transform plugin before using it. Used for compatible with legacy jupiter plugins.
 * @returns Plugin Objects has been required.
 */
export const loadPlugins = (
  appDirectory: string,
  userConfig: UserConfig,
  options: {
    internalPlugins?: typeof INTERNAL_PLUGINS;
    transformPlugin?: TransformPlugin;
  } = {},
) => {
  const pluginConfig = userConfig.plugins;
  const plugins = getAppPlugins(
    appDirectory,
    isOldPluginConfig(pluginConfig) ? pluginConfig : [],
    options.internalPlugins,
  );

  const loadedPlugins = plugins.map(plugin => {
    const _plugin =
      typeof plugin === 'string' || Array.isArray(plugin)
        ? { cli: plugin }
        : plugin;

    const { cli, server } = _plugin;
    const loadedPlugin: LoadedPlugin = {};

    if (cli) {
      loadedPlugin.cli = resolveCliPlugin(
        cli,
        userConfig,
        appDirectory,
        options.transformPlugin,
      );
    }

    // server plugins don't support to accept params
    if (server && typeof server === 'string') {
      loadedPlugin.server = server;
      loadedPlugin.serverPkg = server;
    }

    debug(`resolve plugin %s: %s`, plugin, {
      cli: loadedPlugin.cli,
      server: loadedPlugin.server,
    });

    return loadedPlugin;
  });

  if (!isOldPluginConfig(pluginConfig)) {
    const cliPlugins = Array.isArray(pluginConfig)
      ? pluginConfig
      : pluginConfig?.cli;

    if (cliPlugins?.length) {
      loadedPlugins.push(
        ...cliPlugins.map(item => ({
          cli: createPlugin(item.setup, item),
        })),
      );
    }
  }

  return loadedPlugins;
};
