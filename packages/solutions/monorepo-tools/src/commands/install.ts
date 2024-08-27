import type { PluginAPI } from '@modern-js/core';
import { initDAG } from '../dag';
import { runInstallTask } from '../features/install';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { getProjects } from '../projects/getProjects';

export interface IInstallCommandOption {
  auto?: boolean;
}

export const install = async (
  projectNames: string[],
  option: IInstallCommandOption,
  api: PluginAPI,
) => {
  const { appDirectory } = api.useAppContext();
  const { auto } = option;
  const projects = await getProjects(
    { packagesMatchs: { enableAutoFinder: true } },
    appDirectory,
  );
  const operator = initDAG(projects);
  operator.checkCircle();

  const { rootPath, packageManager } = getMonorepoBaseData(appDirectory);

  await runInstallTask(projectNames, operator, {
    packageManager,
    rootPath,
    auto,
  });
};
