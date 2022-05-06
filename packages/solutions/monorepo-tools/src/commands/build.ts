import type { PluginAPI } from '@modern-js/core';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import { runBuildTask, runAllBuildTask } from '../features/build';
import { getProjects } from '../projects/get-projects';
import { initDAG } from '../dag';
// import { clearProjectsMemoryFile } from './projects/clear-memory-files';

export interface IBuildCommandOption {
  self?: boolean;
  dept?: boolean;
  deps?: boolean;
  onlySelf: boolean;
  all: boolean;
  contentHash?: boolean;
  gitHash?: boolean;
}

export const build = async (
  targetProjectName: string,
  option: IBuildCommandOption,
  api: PluginAPI,
) => {
  const { appDirectory } = api.useAppContext();
  const {
    self = true,
    dept = false,
    deps = true,
    onlySelf = false,
    all = false,
    contentHash = false,
    gitHash = false,
  } = option;
  const projects = await getProjects(
    { packagesMatchs: { enableAutoFinder: true } },
    appDirectory,
  );
  const operator = initDAG(projects);
  operator.checkCircle();

  const { rootPath, packageManager } = getMonorepoBaseData(appDirectory);
  const overrideConfig: Record<string, boolean> = {};
  if (all) {
    overrideConfig.disableWithDeps = false;
    overrideConfig.withSelf = true;
    overrideConfig.withDept = true;
  }

  if (targetProjectName) {
    runBuildTask(targetProjectName, operator, {
      rootPath,
      packageManager,
      withSelf: self,
      withDept: dept,
      onlySelf,
      disableWithDeps: !deps,
      // The CI/CD phase is recommended to be switched on
      disableContentHash: !contentHash,
      enableGitHash: gitHash,
      ...overrideConfig,
    });
  } else {
    const currentDir = process.cwd();
    if (currentDir === appDirectory) {
      await runAllBuildTask(operator, {
        rootPath: currentDir,
        packageManager,
        disableContentHash: !contentHash,
        enableGitHash: gitHash,
      });
    }
    // TODO: 没有指定项目名称的构建任务如何处理
  }
};
