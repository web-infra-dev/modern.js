import type { PluginAPI } from '@modern-js/core';
import { runClearTask } from '../features/clear';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { getProjects } from '../projects/getProjects';
import type { MonorepoTools } from '../type';

export interface IClearCommandOption {
  removeDirs?: string[];
}

export const clear = async (
  projectNames: string[],
  option: IClearCommandOption,
  api: PluginAPI<MonorepoTools>,
) => {
  const { removeDirs } = option;
  const { appDirectory } = api.useAppContext();
  const projects = await getProjects(
    { packagesMatchs: { enableAutoFinder: true } },
    appDirectory,
  );
  const { rootPath } = getMonorepoBaseData(appDirectory);
  runClearTask(projectNames, projects, {
    rootPath,
    removeDirs,
  });
};
