import { useAppContext } from '@modern-js/core';
import { logger } from '@modern-js/utils';
import { initDAG } from '../dag';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { getProjects } from '../projects/get-projects';
import { deploy as runDeployTask } from '../features/deploy';

export interface IDeployCommandOption {
  deployPath?: string;
}

export const deploy = async (
  deployProjectNames: string[],
  option: IDeployCommandOption,
) => {
  const { deployPath = 'output' } = option;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { appDirectory } = useAppContext();
  logger.info(`start deploy ${deployProjectNames.join(',')}`);
  const projects = await getProjects(
    { packagesMatchs: { enableAutoFinder: true } },
    appDirectory,
  );

  const { rootPath, packageManager } = getMonorepoBaseData(process.cwd());
  const operator = initDAG(projects);
  await runDeployTask(deployProjectNames, operator, {
    rootPath,
    packageManager,
    deployPath,
  });
};
