import {
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

/**
 * @deprecated
 * Using NewPluginConfig insteand.
 */
type OldPluginConfig = Array<
  | PluginItem
  | {
      cli?: PluginItem;
      server?: PluginItem;
    }
>;

type NewPluginConfig = {
  cli?: CliPlugin[];
  /** Custom server plugin is not supported yet. */
  server?: never;
};

export type PluginConfig = OldPluginConfig | NewPluginConfig;

/**
 * Try to resolve plugin entry file path.
 * @param name - Plugin name.
 * @param appDirectory - Application root directory.
 * @returns Resolved file path.
 */
const tryResolve = (name: string, appDirectory: string) => {
  let filePath = '';
  try {
    filePath = require.resolve(name, { paths: [appDirectory] });
    delete require.cache[filePath];
  } catch (err) {
    if ((err as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(`Can not find plugin ${name}.`);
    }
    throw err;
  }
  return filePath;
};

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
          // 参考 packages/cli/core/src/cli.ts 文件
          return true;
        }
        return isDepExists(appDirectory, name);
      })
      .map(name => allPlugins[name]),
    ...oldPluginConfig,
  ];
  return appPlugins;
}

const resolveCliPlugin = (p: PluginItem, appDirectory: string): CliPlugin => {
  const pkg = typeof p === 'string' ? p : p[0];
  const path = tryResolve(pkg, appDirectory);
  const module = compatRequire(path);

  if (typeof module === 'function') {
    const pluginOptions = Array.isArray(p) ? p[1] : undefined;
    const result: CliPlugin = module(pluginOptions);
    return createPlugin(result.setup, result);
  }
  return module;
};

/**
 * Load internal plugins which in @modern-js scope and user's custom plugins.
 * @param appDirectory - Application root directory.
 * @param userConfig - Resolved user config.
 * @param options.internalPlugins - Internal plugins.
 * @returns Plugin Objects has been required.
 */
export const loadPlugins = (
  appDirectory: string,
  userConfig: UserConfig,
  options: {
    internalPlugins?: typeof INTERNAL_PLUGINS;
  } = {},
) => {
  const pluginConfig = userConfig.plugins;
  const plugins = getAppPlugins(
    appDirectory,
    Array.isArray(pluginConfig) ? pluginConfig : [],
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
      loadedPlugin.cli = resolveCliPlugin(cli, appDirectory);
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

  if (!Array.isArray(pluginConfig) && pluginConfig?.cli?.length) {
    loadedPlugins.push(
      ...pluginConfig.cli.map(item => ({
        cli: createPlugin(item.setup, item),
      })),
    );
  }

  return loadedPlugins;
};
