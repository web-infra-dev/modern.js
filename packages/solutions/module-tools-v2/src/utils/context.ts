import type { PluginAPI } from '@modern-js/core';
import type { ModuleToolsHooks } from '../types';

export const initModuleContext = async (api: PluginAPI<ModuleToolsHooks>) => {
  const { isTypescript } = await import('@modern-js/utils');
  const appContext = api.useAppContext();
  const isTsProject = isTypescript(appContext.appDirectory);

  return { isTsProject };
};
