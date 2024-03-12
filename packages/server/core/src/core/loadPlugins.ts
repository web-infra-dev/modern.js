// import { InternalPlugins } from '@modern-js/types';
// import {
//   // compatRequire,
//   // getInternalPlugins,
//   // tryResolve,
// } from '@modern-js/utils';
import { createPlugin, ServerPlugin } from '../core/plugin';

const resolvePlugin = async (
  p: string | ServerPlugin,
  _appDirectory: string,
) => {
  const isPluginInstance = typeof p !== 'string';
  if (isPluginInstance) {
    return {
      module: createPlugin(p.setup, p),
    };
  }

  // const pluginPath = tryResolve(p, appDirectory);
  // const module = compatRequire(pluginPath);
  const module = await import(p);

  const pluginInstance: ServerPlugin = module();
  return {
    module: createPlugin(pluginInstance.setup, pluginInstance),
  };
};

export const loadPlugins = async (
  appDirectory: string,
  // server plugin in config must be new syntax
  configPlugins: ServerPlugin[],
  // options: {
  //   internalPlugins?: InternalPlugins;
  // },
): Promise<ReturnType<typeof createPlugin>[]> => {
  // const loadedPlugins = getInternalPlugins(
  //   appDirectory,
  //   options.internalPlugins,
  // );

  return Promise.all(
    [
      // ...loadedPlugins,
      ...configPlugins,
    ].map(async plugin => {
      const { module } = await resolvePlugin(plugin, appDirectory);
      return module;
    }),
  );
};
