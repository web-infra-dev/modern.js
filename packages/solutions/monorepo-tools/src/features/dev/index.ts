import anymatch from 'anymatch';
import { chokidar } from '@modern-js/utils';
import { ICommandConfig } from '../../type';
import { MultitasksLogger } from '../../log/multi-tasks-log';
import { DagOperator } from '../../dag/operator';
import { IProjectNode } from '../../projects/get-projects';
import { Argu } from '../../utils/types';
import { WatchedProjectsState } from './watch-projects-state';
import { defaultBuildWatchCmds, BuildWatchCmdsType } from './cmds';
import { createDependenciesTask, createDevTask } from './create-task';

export interface IBuildWatchConfig extends ICommandConfig {
  onlySelf?: boolean;
  ignoreMaybeChanged?: Argu<typeof anymatch>;
  needInit?: boolean; // 是否最开始执行依赖项目的任务
}

export interface IProjectChangeResult {
  /**
   * The set of projects that have changed since the last iteration
   */
  changedProjects: Readonly<IProjectNode[]>;

  /**
   * Contains the git hashes for all tracked files in the repo
   */
  state: any;
}

const getIgnored = (config: IBuildWatchConfig) => (watchFilePath: string) => {
  // 默认忽略 node_modules 的变化和 dist 目录下文件的变化
  const nodeModulesPattern = /(?:^|[\\/])node_modules/g;
  if (
    nodeModulesPattern.test(watchFilePath) ||
    watchFilePath.includes('dist')
  ) {
    return true;
  }

  if (config.ignoreMaybeChanged) {
    return anymatch(config.ignoreMaybeChanged)(watchFilePath);
  }

  return false;
};

export const runBuildWatchTask = async (
  projectName: string,
  operator: DagOperator,
  config: IBuildWatchConfig,
  taskCmds: BuildWatchCmdsType = defaultBuildWatchCmds,
) => {
  const { needInit = true } = config;
  const taskLogger = new MultitasksLogger();
  const dependenciesTask = createDependenciesTask(config, taskCmds, taskLogger);
  const devTask = createDevTask(config, taskCmds, taskLogger);
  const fromNodes = operator.getNodeAllDependencyData(projectName);
  const watchedProjectState = new WatchedProjectsState(fromNodes, config);

  const watcher = new chokidar.FSWatcher({
    persistent: true,
    cwd: config.rootPath,
    followSymlinks: false,
    ignoreInitial: true,
    ignored: getIgnored(config),
    disableGlobbing: true,
    interval: 1000,
  });
  watcher.add(watchedProjectState.getWatchedProjectsPath());

  // 可能会移除该判断和 neeInit 配置
  if (needInit) {
    await operator.traverseDependenciesToProject(
      projectName,
      async currentProject => {
        await dependenciesTask(currentProject);
      },
    );
  }

  await new Promise(resolve => {
    console.info('start watch');
    watcher.on('all', async (eventName, changeFilePath) => {
      // TODO: 错误情况处理
      if (eventName === 'add') {
        watchedProjectState.updateState();
      }

      const changedProject =
        watchedProjectState.getChangedProject(changeFilePath);
      if (changedProject) {
        await operator.traverseProjectToDependent(
          changedProject.name,
          async (currentProject, _, earlyFinish) => {
            // 调试的项目跳过
            if (currentProject.name === projectName) {
              earlyFinish();
              return;
            }

            if (
              watchedProjectState.watchProjectsName.includes(
                currentProject.name,
              )
            ) {
              console.info('run build', currentProject.name);
              await dependenciesTask(currentProject);
            }
          },
          { withSelf: true },
        );
        resolve(null);
      } else {
        console.info('changed is not in monorepo manager');
      }
    });
    resolve(null);
  });

  // 执行目标项目的 dev 任务
  await devTask(operator.getNodeData(projectName, { checkExist: true }));
};
