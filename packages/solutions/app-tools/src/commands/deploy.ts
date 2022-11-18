import type { PluginAPI } from '@modern-js/core';
import type { AppTools } from '../types';

export const deploy = async (api: PluginAPI<AppTools>, options: any) => {
  const hookRunners = api.useHookRunners();
  await hookRunners.beforeDeploy(options);
  await hookRunners.afterDeploy(options);
};
