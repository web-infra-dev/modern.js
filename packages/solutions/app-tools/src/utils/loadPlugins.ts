import { ServerPlugin as ServerPluginInstance } from '@modern-js/server-core';
import { loadServerPlugins as loadServerPluginInstances } from '@modern-js/prod-server';
import { ServerPlugin } from '@modern-js/types';
import { AppTools, PluginAPI } from '../types';

export async function getServerPlugins(
  api: PluginAPI<AppTools<'shared'>>,
): Promise<ServerPlugin[]> {
  const runner = api.useHookRunners();
  const { plugins } = await runner._internalServerPlugins({ plugins: [] });

  api.setAppContext({
    ...api.useAppContext(),
    serverPlugins: plugins,
  });

  return plugins;
}

export async function loadServerPlugins(
  api: PluginAPI<AppTools<'shared'>>,
  appDirectory: string,
): Promise<ServerPluginInstance[]> {
  const plugins = await getServerPlugins(api);

  const instances = loadServerPluginInstances(plugins, appDirectory);

  return instances;
}
