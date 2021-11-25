import {
  isDepExists,
  createDebugger,
  compatRequire,
  INTERNAL_PLUGINS,
  getPackageJsonFrom,
} from '@modern-js/utils';

const debug = createDebugger('load-plugins');
const moduleToolsPackageName = '@modern-js/module-tools';

export interface PluginConfigItem {
  cli?: string;
  server?: string;
}

export type PluginConfig = Array<PluginConfigItem>;

/**
 * Try to resolve plugin entry file path.
 * @param appDirectory - Application root directory.
 * @param plugin - Plugin name or plugin name with options.
 * @returns Resolved file path.
 */
const resolvePlugin = (appDirectory: string, plugin: PluginConfigItem) => {
  const tryResolve = (name: string) => {
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

  const resolved: PluginConfigItem = {};

  if (plugin.cli) {
    resolved.cli = tryResolve(plugin.cli);
  }

  if (plugin.server) {
    resolved.server = tryResolve(plugin.server);
  }

  return resolved;
};

const filterWorkspaceProtocolDeps = ({
  appDirectory,
  plugins,
}: {
  appDirectory: string;
  plugins: { cli?: string; server?: string }[];
}) => {
  const projectPkgJson = getPackageJsonFrom(appDirectory) || {};
  // If both 'devDependencies' and 'dependencie' exist, the 'dependencie' should cover 'devDependencies'.
  const depsHash = {
    ...(projectPkgJson.devDependencies || {}),
    ...(projectPkgJson.dependencies || {}),
  };
  const depsNames = Object.keys(depsHash);
  const getPluginName = (plugin: { cli?: string; server?: string }) => {
    if (plugin.cli && typeof plugin.cli === 'string') {
      return plugin.cli.split('/').slice(0, 2).join('/');
    }
    if (plugin.server && typeof plugin.server === 'string') {
      return plugin.server.split('/').slice(0, 2).join('/');
    }

    return undefined;
  };
  const shouldLoad = (pluginName: string) => {
    const depName = depsNames.find(n => n === pluginName);
    const versionWithworkspaceProtocol = 'workspace:';
    if (depName) {
      return !depsHash[depName].includes(versionWithworkspaceProtocol);
    }

    return false;
  };
  return plugins.filter(plugin => {
    const pluginName = getPluginName(plugin);
    if (pluginName) {
      return shouldLoad(pluginName);
    }

    return false;
  });
};

/**
 * Load internal plugins which in @modern-js scope and user's custom plugins.
 * @param appDirectory - Application root directory.
 * @param pluginsConfig - Plugins declared in the user configuration.
 * @returns Plugin Objects has been required.
 */
export const loadPlugins = (
  appDirectory: string,
  pluginConfig: PluginConfig,
) => {
  let plugins = [
    ...Object.keys(INTERNAL_PLUGINS)
      .filter(name => isDepExists(appDirectory, name))
      .map(name => INTERNAL_PLUGINS[name]),
    ...pluginConfig,
  ];

  const isModuleToolsRunning = plugins.find((plugin: { cli?: string }) => {
    if (plugin.cli?.includes(moduleToolsPackageName)) {
      return true;
    }
    return false;
  });

  if (isModuleToolsRunning) {
    plugins = filterWorkspaceProtocolDeps({ appDirectory, plugins });
    debug(`module tools running and filter plugins is %s`, plugins);
  }

  return plugins.map(plugin => {
    const { cli, server } = resolvePlugin(appDirectory, plugin);

    debug(`resolve plugin %s: %s`, plugin, {
      cli,
      server,
    });

    return {
      cli: cli && compatRequire(cli),
      server: server && compatRequire(server),
    };
  });
};
