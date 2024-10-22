import type { PluginAPI } from '@modern-js/core';
import { initDAG } from '../dag';
import { runBuildWatchTask } from '../features/dev';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { getProjects } from '../projects/getProjects';

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
