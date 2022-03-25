import type { PluginAPI } from '@modern-js/core';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { runBuildWatchTask } from '../features/dev';
import { getProjects } from '../projects/get-projects';
import { initDAG } from '../dag';

export interface IBuildWatchCommandOption {
  onlySelf?: boolean;
  init?: boolean;
}

export const buildWatch = async (
  targetProjectName: string,
  option: IBuildWatchCommandOption,
  api: PluginAPI,
) => {
  const { appDirectory } = api.useAppContext();
  const { onlySelf = false, init = false } = option;
  const projects = await getProjects(
    { packagesMatchs: { enableAutoFinder: true } },
    appDirectory,
  );
  const operator = initDAG(projects);
  operator.checkCircle();

  const { rootPath, packageManager } = getMonorepoBaseData(process.cwd());

  await runBuildWatchTask(targetProjectName, operator, {
    rootPath,
    packageManager,
    onlySelf,
    needInit: init,
  });
};
