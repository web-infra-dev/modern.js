import type { PluginAPI } from '@modern-js/core';
import type { ModuleTools } from '../types';

export const initModuleContext = async (api: PluginAPI<ModuleTools>) => {
  const { isTypescript } = await import('@modern-js/utils');
  const { appDirectory } = api.useAppContext();
  const isTsProject = isTypescript(appDirectory);

  return { isTsProject, appDirectory };
};
