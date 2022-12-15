import { INTERNAL_SERVER_PLUGINS } from '@modern-js/utils/constants';
import { AppTools, PluginAPI } from '../types';

export async function getServerInternalPlugins(api: PluginAPI<AppTools>) {
  const hookRunners = api.useHookRunners();
  const { plugins: serverPlugins } = await hookRunners.collectServerPlugins({
    plugins: [],
  });
  const serverInternalPlugins = Object.fromEntries(
    Object.entries(INTERNAL_SERVER_PLUGINS).filter(([key, _]) =>
      serverPlugins.includes(key),
    ),
  );
  api.setAppContext({
    ...api.useAppContext(),
    serverInternalPlugins,
  });
  return serverInternalPlugins;
}
