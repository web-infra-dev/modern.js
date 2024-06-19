import { ServerPlugin } from '@modern-js/types';
import { compatRequire, tryResolve } from '@modern-js/utils';
import { ServerPlugin as ServerPluginInstance } from '../../../types';

function resolveServerPlugin(
  plugin: ServerPlugin,
  appDirectory: string,
): ServerPluginInstance {
  const { name, options } = plugin;

  const pluginPath = tryResolve(name, appDirectory);

  const module = compatRequire(pluginPath);

  const pluginInstance = module(options);

  return pluginInstance;
}

export function loadServerPlugins(
  serverPlugins: ServerPlugin[],
  appDirectory: string,
): ServerPluginInstance[] {
  const instances = serverPlugins.map(plugin =>
    resolveServerPlugin(plugin, appDirectory),
  );

  return instances;
}
