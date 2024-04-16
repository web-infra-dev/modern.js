import { InternalPlugins } from '@modern-js/types';
import {
  compatRequire,
  getInternalPlugins,
  tryResolve,
} from '@modern-js/utils';
import { createPlugin, ServerPlugin } from '../core/plugin';

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
  internalPlugins: InternalPlugins,
): ReturnType<typeof createPlugin>[] => {
  const loadedPlugins = getInternalPlugins(appDirectory, internalPlugins);

  return loadedPlugins.map(plugin => {
    const { module } = resolvePlugin(plugin, appDirectory);
    return module;
  });
};
