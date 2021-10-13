import { useAppContext } from '@modern-js/core';
import { getProjects } from '../projects/get-projects';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { runClearTask } from '../features/clear';

export interface IClearCommandOption {
  removeDirs?: string[];
}

export const clear = async (
  projectNames: string[],
  option: IClearCommandOption,
) => {
  const { removeDirs } = option;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { appDirectory } = useAppContext();
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
