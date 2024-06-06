import { ServerPlugin as ServerPluginInstance } from '@modern-js/server-core';
import { loadServerPlugins } from '@modern-js/prod-server';
import { AppTools, PluginAPI } from '../types';

export async function loadPlugins(
  api: PluginAPI<AppTools<'shared'>>,
  appDirectory: string,
): Promise<ServerPluginInstance[]> {
  const runner = api.useHookRunners();
  const { plugins } = await runner._internalServerPlugins({ plugins: [] });

  api.setAppContext({
    ...api.useAppContext(),
    serverPlugins: plugins,
  });

  const instances = loadServerPlugins(plugins, appDirectory);

  return instances;
}
