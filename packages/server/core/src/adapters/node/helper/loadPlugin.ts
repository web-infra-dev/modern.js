import type { ServerPlugin } from '@modern-js/types';
import { compatibleRequire, tryResolve } from '@modern-js/utils';
import type { ServerPlugin as ServerPluginInstance } from '../../../types';

async function resolveServerPlugin(
  plugin: ServerPlugin,
  appDirectory: string,
): Promise<ServerPluginInstance> {
  const { name, options } = plugin;

  const pluginPath = tryResolve(name, appDirectory);

  const module = await compatibleRequire(pluginPath);

  const pluginInstance = module(options);

  return pluginInstance;
}

export async function loadServerPlugins(
  serverPlugins: ServerPlugin[],
  appDirectory: string,
): Promise<ServerPluginInstance[]> {
  const instances = await Promise.all(
    serverPlugins.map(plugin => resolveServerPlugin(plugin, appDirectory)),
  );

  return instances;
}
