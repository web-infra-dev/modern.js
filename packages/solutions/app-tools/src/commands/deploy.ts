import type { PluginAPI } from '@modern-js/core';
import type { AppHooks } from '../hooks';

export const deploy = async (api: PluginAPI<AppHooks>, options: any) => {
  const hookRunners = api.useHookRunners();
  await hookRunners.beforeDeploy(options);
  await hookRunners.afterDeploy(options);
};
