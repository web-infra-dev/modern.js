import { loadServerPlugins as loadServerPluginInstances } from '@modern-js/prod-server';
import type { ServerPlugin as ServerPluginInstance } from '@modern-js/server-core';
import type { ServerPlugin } from '@modern-js/types';
import type { AppTools } from '../new/types';

export async function getServerPlugins(
  api: AppTools<'shared'>,
  metaName = 'modern-js',
): Promise<ServerPlugin[]> {
  const hooks = api.getHooks();
  const { plugins } = (await hooks._internalServerPlugins.call({
    plugins: [],
  })) as any as { plugins: ServerPlugin[] };

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
  api: AppTools<'shared'>,
  appDirectory: string,
  metaName: string,
): Promise<ServerPluginInstance[]> {
  const plugins = await getServerPlugins(api, metaName);

  const instances = await loadServerPluginInstances(plugins, appDirectory);

  return instances;
}
