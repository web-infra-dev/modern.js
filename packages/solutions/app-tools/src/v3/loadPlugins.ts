import type { Plugin } from '@modern-js/plugin-v2';
import type { InternalPlugins } from '@modern-js/types';
import {
  compatibleRequire,
  createDebugger,
  dynamicImport,
  getInternalPlugins,
  tryResolve,
} from '@modern-js/utils';
const debug = createDebugger('load-plugins');

const resolveCliPlugin = async (
  p: string,
  appDirectory: string,
): Promise<Plugin> => {
  const pkg = typeof p === 'string' ? p : p[0];
  //   const pluginOptions = typeof p === 'string' ? undefined : p[1];
  const path = tryResolve(pkg, appDirectory);
  let module;
  try {
    module = await compatibleRequire(path);
  } catch (e) {
    // load esm module
    ({ default: module } = await dynamicImport(path));
  }

  // TODO handle string plugin
  //   if (typeof module === 'function') {
  //     const result: Plugin = module(pluginOptions);
  //     return createPlugin(result.setup, result);
  //   }

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
  autoLoad?: InternalPlugins,
  forceAutoLoadPlugins?: boolean,
) => {
  const plugins = [
    ...(forceAutoLoadPlugins
      ? getInternalPlugins(appDirectory, internalPlugins)
      : []),
    ...(autoLoad ? getInternalPlugins(appDirectory, autoLoad) : []),
  ];

  const loadedPlugins = await Promise.all(
    plugins.map(plugin => {
      const loadedPlugin = resolveCliPlugin(plugin, appDirectory);

      debug(`resolve plugin %s: %s`, plugin, loadedPlugin);

      return loadedPlugin;
    }),
  );

  return loadedPlugins;
};
