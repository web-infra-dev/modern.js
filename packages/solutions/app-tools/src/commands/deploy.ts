import type { PluginAPI } from '@modern-js/core';

export const deploy = async (api: PluginAPI, options: any) => {
  const hookRunners = api.useHookRunners();
  await hookRunners.beforeDeploy(options);
  await hookRunners.afterDeploy(options);
};
