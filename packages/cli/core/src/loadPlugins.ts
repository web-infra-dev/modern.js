import {
  isDepExists,
  createDebugger,
  compatRequire,
  INTERNAL_PLUGINS,
} from '@modern-js/utils';
import type { UserConfig } from './config';

const debug = createDebugger('load-plugins');

type Plugin = string | [string, any];

export type LoadedPlugin = {
  cli?: any;
  cliPkg?: string;
  server?: any;
  serverPkg?: string;
};

export type PluginConfigItem =
  | {
      cli?: Plugin;
      server?: Plugin;
    }
  | Plugin;

export type PluginConfig = Array<PluginConfigItem>;

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
  pluginConfig: PluginConfig,
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
    ...pluginConfig,
  ];
  return appPlugins;
}

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
  const { internalPlugins } = options;

  const resolvePlugin = (p: Plugin) => {
    const pkg = typeof p === 'string' ? p : p[0];
    const path = tryResolve(pkg, appDirectory);
    let module = compatRequire(path);
    const pluginOptions = Array.isArray(p) ? p[1] : undefined;

    module = typeof module === 'function' ? module(pluginOptions) : module;

    return {
      pkg,
      path,
      module,
    };
  };

  const plugins = getAppPlugins(
    appDirectory,
    userConfig.plugins || [],
    internalPlugins,
  );

  return plugins.map(plugin => {
    const _plugin =
      typeof plugin === 'string' || Array.isArray(plugin)
        ? { cli: plugin }
        : plugin;

    const { cli, server } = _plugin;
    const loadedPlugin: LoadedPlugin = {} as LoadedPlugin;
    if (cli) {
      const { pkg, path, module } = resolvePlugin(cli);

      loadedPlugin.cli = { ...module, pluginPath: path };
      loadedPlugin.cliPkg = pkg;
    }

    // server plugins don't support to accept params
    if (server && typeof server === 'string') {
      const path = tryResolve(server, appDirectory);

      loadedPlugin.server = { pluginPath: path };
      loadedPlugin.serverPkg = server;
    }

    debug(`resolve plugin %s: %s`, plugin, {
      cli: loadedPlugin.cli,
      server: loadedPlugin.server,
    });

    return loadedPlugin;
  });
};
