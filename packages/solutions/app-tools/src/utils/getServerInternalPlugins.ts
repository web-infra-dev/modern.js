import { AppTools, PluginAPI } from '../types';

export async function getServerInternalPlugins(
  api: PluginAPI<AppTools<'shared'>>,
) {
  const hookRunners = api.useHookRunners();
  const { plugins: serverPlugins } = await hookRunners.collectServerPlugins({
    plugins: [],
  });

  const serverInternalPlugins = serverPlugins.reduce(
    (result, plugin) => Object.assign(result, plugin),
    {},
  );
  api.setAppContext({
    ...api.useAppContext(),
    serverInternalPlugins,
  });
  return serverInternalPlugins;
}
