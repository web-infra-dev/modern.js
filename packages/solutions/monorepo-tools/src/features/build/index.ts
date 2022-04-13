import os from 'os';
import { execa, signale } from '@modern-js/utils';
import type { IProjectNode } from '../../projects/get-projects';
import type { ICommandConfig } from '../../type';
import { DagOperator } from '../../dag/operator';
import {
  checkProjectChangeByGit,
  checkProjectChangeByContent,
} from '../../projects/check-project-change';
import { errorLog } from '../../log/error';
import { MultitasksLogger } from '../../log/multi-tasks-log';

const createTask = (
  config: IBuildConfig,
  taskCmds = defaultBuildCmds,
  taskLogger: MultitasksLogger,
) => {
  const {
    rootPath,
    packageManager,
    disableContentHash = false,
    enableGitHash = false,
  } = config;

  const task = async (project: IProjectNode) => {
    console.info('run ', project.name);
    // const taskTimeLog = timeLog.initTimeLog({ scope: '' });
    if (!disableContentHash) {
      const changed = await checkProjectChangeByContent(project);
      if (!changed) {
        console.info(`${project.name} content not change, skip`);
        return;
      }
    }

    if (enableGitHash) {
      const changed = await checkProjectChangeByGit(project, rootPath);

      if (!changed) {
        console.info(`${project.name} not change, skip`);
        return;
      }

      console.info(`${project.name} have changed in git history`);
    }
    const cmd = project.extra.scripts || {};
    for (const taskCmd of taskCmds) {
      if (cmd[taskCmd]) {
        const prefix = `run ${project.name} ${taskCmd} script`;
        // timeLog.startTime(taskTimeLog, prefix);
        signale.time(prefix);
        try {
          const childProcess = execa(packageManager, [taskCmd], {
            cwd: project.extra.path,
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          taskLogger.addLogProvider(project.name, {
            stdout: childProcess.stdout,
            stderr: childProcess.stderr,
            logConfig: { label: 'BUILD: ' },
          });

          await childProcess;
          // timeLog.endTime(taskTimeLog, prefix);
          signale.timeEnd(prefix);
        } catch (e: any) {
          errorLog(project.name, e.message);
        }
      } else {
        console.info(`${project.name} not have ${taskCmd}, skip it.`);
      }
    }
  };

  return task;
};

export interface IBuildConfig extends ICommandConfig {
  withSelf?: boolean;
  onlySelf?: boolean;
  withDept?: boolean;
  disableWithDeps?: boolean;
  disableContentHash?: boolean;
  enableGitHash?: boolean;
}

const defaultBuildCmds = ['build'];

export const runBuildTask = async (
  projectName: string,
  operator: DagOperator,
  config: IBuildConfig,
  taskCmds = defaultBuildCmds,
) => {
  const {
    withSelf = true,
    onlySelf = false,
    disableWithDeps = false,
    withDept = false,
  } = config;
  const taskLogger = new MultitasksLogger();
  const task = createTask(config, taskCmds, taskLogger);
  // 优先级 onlySelf > withDept、disableWithDeps
  if (onlySelf) {
    await task(operator.getNodeData(projectName, { checkExist: true }));
  } else if (!disableWithDeps && withDept) {
    await operator.traverseDependenciesToProjectToDependent(projectName, task, {
      withSelf,
      runTaskConcurrency: os.cpus().length,
    });
  } else if (disableWithDeps && withDept) {
    await operator.traverseProjectToDependent(projectName, task, {
      withSelf,
      runTaskConcurrency: os.cpus().length,
    });
  } else {
    operator.traverseDependenciesToProject(projectName, task, {
      withSelf,
      runTaskConcurrency: os.cpus().length,
    });
  }
};

export const runAllBuildTask = async (
  operator: DagOperator,
  config: IBuildConfig,
  taskCmds = defaultBuildCmds,
) => {
  const taskLogger = new MultitasksLogger();
  const task = createTask(config, taskCmds, taskLogger);
  await operator.traverseAllNodes(task);
};
