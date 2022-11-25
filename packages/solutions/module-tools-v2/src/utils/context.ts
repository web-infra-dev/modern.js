import type { PluginAPI } from '@modern-js/core';
import type { ModuleToolsHooks, ModuleContext } from '../types';

export const initModuleContext = async (
  api: PluginAPI<ModuleToolsHooks>,
): Promise<ModuleContext> => {
  const { isTypescript } = await import('@modern-js/utils');
  const { appDirectory } = api.useAppContext();
  const isTsProject = isTypescript(appDirectory);

  return { isTsProject, appDirectory };
};
