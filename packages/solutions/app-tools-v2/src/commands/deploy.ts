import type { PluginAPI } from '@modern-js/core';
import type { AppTools } from '../types';
import { getServerInternalPlugins } from '../utils/server';

export const deploy = async (
  api: PluginAPI<AppTools<'shared'>>,
  options: any,
) => {
  const hookRunners = api.useHookRunners();
  // deploy command need get all plugins
  await getServerInternalPlugins(api);

  await hookRunners.beforeDeploy(options);
  await hookRunners.afterDeploy(options);
};
