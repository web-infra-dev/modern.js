import { ServerPlugin as ServerPluginInstance } from '@modern-js/server-core';
import { loadServerPlugins as loadServerPluginInstances } from '@modern-js/prod-server';
import { ServerPlugin } from '@modern-js/types';
import { AppTools, PluginAPI } from '../types';

export async function getServerPlugins(
  api: PluginAPI<AppTools<'shared'>>,
  metaName = 'modern-js',
): Promise<ServerPlugin[]> {
  const runner = api.useHookRunners();
  const { plugins } = await runner._internalServerPlugins({ plugins: [] });

  // filter plugins by metaName
  const filtedPlugins = plugins.filter(plugin =>
    plugin.name.includes(metaName),
  );

  api.setAppContext({
    ...api.useAppContext(),
    serverPlugins: filtedPlugins,
  });

  return filtedPlugins;
}

export async function loadServerPlugins(
  api: PluginAPI<AppTools<'shared'>>,
  appDirectory: string,
  metaName: string,
): Promise<ServerPluginInstance[]> {
  const plugins = await getServerPlugins(api, metaName);

  const instances = await loadServerPluginInstances(plugins, appDirectory);

  return instances;
}
