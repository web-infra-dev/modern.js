import { InternalPlugins } from '@modern-js/types';
import {
  compatRequire,
  getInternalPlugins,
  tryResolve,
} from '@modern-js/utils';
import { createPlugin, ServerPlugin } from './plugin';

const resolvePlugin = (p: string | ServerPlugin, appDirectory: string) => {
  const isPluginInstance = typeof p !== 'string';
  if (isPluginInstance) {
    return {
      module: createPlugin(p.setup, p),
    };
  }

  const pluginPath = tryResolve(p, appDirectory);
  const module = compatRequire(pluginPath);
  const pluginInstance: ServerPlugin = module();
  return {
    module: createPlugin(pluginInstance.setup, pluginInstance),
  };
};

export const loadPlugins = (
  appDirectory: string,
  // server plugin in config must be new syntax
  configPlugins: ServerPlugin[],
  options: {
    internalPlugins?: InternalPlugins;
  },
) => {
  const loadedPlugins = getInternalPlugins(
    appDirectory,
    options.internalPlugins,
  );

  return [...loadedPlugins, ...configPlugins].map(plugin => {
    const { module } = resolvePlugin(plugin, appDirectory);
    return module;
  });
};
