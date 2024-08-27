import type { PluginAPI } from '@modern-js/core';
import type { AppTools } from '../types';
import { getServerPlugins } from '../utils/loadPlugins';

export const deploy = async (
  api: PluginAPI<AppTools<'shared'>>,
  options: any,
) => {
  const hookRunners = api.useHookRunners();

  const { metaName } = api.useAppContext();

  // deploy command need get all plugins
  await getServerPlugins(api, metaName);

  await hookRunners.beforeDeploy(options);
  await hookRunners.deploy(options);
  await hookRunners.afterDeploy(options);
};
