import { logger } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { initDAG } from '../dag';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { getProjects } from '../projects/get-projects';
import { deploy as runDeployTask } from '../features/deploy';

export interface IDeployCommandOption {
  deployPath?: string;
}

export const deploy = async (
  api: PluginAPI,
  deployProjectNames: string[],
  option: IDeployCommandOption,
  ignoreMatchs: string[] = [],
) => {
  const { deployPath = 'output' } = option;
  const { appDirectory } = api.useAppContext();
  logger.info(`start deploy ${deployProjectNames.join(',')}`);
  const projects = await getProjects(
    {
      packagesMatchs: { enableAutoFinder: true },
      packagesIgnoreMatchs: ignoreMatchs,
    },
    appDirectory,
  );

  const { rootPath, packageManager } = getMonorepoBaseData(process.cwd());
  const operator = initDAG(projects);
  await runDeployTask(deployProjectNames, operator, {
    rootPath,
    packageManager,
    deployPath,
  });

  const runners = api.useHookRunners();
  runners.afterMonorepoDeploy({ operator, deployProjectNames });
};
