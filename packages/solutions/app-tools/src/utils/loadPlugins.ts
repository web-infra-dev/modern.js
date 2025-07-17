import type { CLIPluginAPI } from '@modern-js/plugin';
import type { Plugin } from '@modern-js/plugin';
import { loadServerPlugins as loadServerPluginInstances } from '@modern-js/prod-server';
import type { ServerPlugin as ServerPluginInstance } from '@modern-js/server-core';
import type { ServerPlugin } from '@modern-js/types';
import type { InternalPlugins } from '@modern-js/types';
import {
  compatibleRequire,
  createDebugger,
  dynamicImport,
  getInternalPlugins,
  tryResolve,
} from '@modern-js/utils';
import type { AppTools } from '../types';
const debug = createDebugger('load-plugins');

export async function getServerPlugins(
  api: CLIPluginAPI<AppTools>,
  metaName = 'modern-js',
): Promise<ServerPlugin[]> {
  const hooks = api.getHooks();
  const { plugins } = await hooks._internalServerPlugins.call({ plugins: [] });

  // filter plugins by metaName
  const filtedPlugins = plugins.filter(plugin =>
    plugin.name.includes(metaName),
  );

  api.updateAppContext({
    serverPlugins: filtedPlugins,
  });

  return filtedPlugins;
}

export async function loadServerPlugins(
  api: CLIPluginAPI<AppTools>,
  appDirectory: string,
  metaName: string,
): Promise<ServerPluginInstance[]> {
  const plugins = await getServerPlugins(api, metaName);

  const instances = await loadServerPluginInstances(plugins, appDirectory);

  return instances;
}

const resolveCliPlugin = async (
  p: string,
  appDirectory: string,
): Promise<Plugin> => {
  const pkg = typeof p === 'string' ? p : p[0];
  const pluginOptions = typeof p === 'string' ? undefined : p[1];
  const path = tryResolve(pkg, appDirectory);
  let module;
  try {
    module = await compatibleRequire(path);
  } catch (e) {
    // load esm module
    ({ default: module } = await dynamicImport(path));
  }

  // handle string plugin
  if (typeof module === 'function') {
    const result: Plugin = module(pluginOptions);
    return result;
  }

  return module;
};

/**
 * Load internal plugins which in @modern-js scope and user's custom plugins.
 * @param appDirectory - Application root directory.
 * @param internalPlugins - Internal plugins.
 * @returns Plugin Objects has been required.
 */
export const loadInternalPlugins = async (
  appDirectory: string,
  internalPlugins?: InternalPlugins,
) => {
  const plugins = getInternalPlugins(appDirectory, internalPlugins);

  const loadedPlugins = await Promise.all(
    plugins.map(plugin => {
      const loadedPlugin = resolveCliPlugin(plugin, appDirectory);

      debug(`resolve plugin %s: %s`, plugin, loadedPlugin);

      return loadedPlugin;
    }),
  );

  return loadedPlugins;
};
