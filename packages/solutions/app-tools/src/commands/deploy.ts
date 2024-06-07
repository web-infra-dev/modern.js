import type { PluginAPI } from '@modern-js/core';
import { getServerPlugins } from '../utils/loadPlugins';
import type { AppTools } from '../types';

export const deploy = async (
  api: PluginAPI<AppTools<'shared'>>,
  options: any,
) => {
  const hookRunners = api.useHookRunners();
  // deploy command need get all plugins
  await getServerPlugins(api);

  await hookRunners.beforeDeploy(options);
  await hookRunners.deploy(options);
  await hookRunners.afterDeploy(options);
};
