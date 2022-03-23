import type { PluginAPI } from '@modern-js/core';
import { getProjects } from '../projects/get-projects';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { runClearTask } from '../features/clear';

export interface IClearCommandOption {
  removeDirs?: string[];
}

export const clear = async (
  projectNames: string[],
  option: IClearCommandOption,
  api: PluginAPI,
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
