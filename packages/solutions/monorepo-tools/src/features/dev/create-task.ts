import { execa, logger } from '@modern-js/utils';
import type { IProjectNode } from '../../projects/get-projects';
import { errorLog } from '../../log/error';
import * as timeLog from '../../log/time';
import type { MultitasksLogger } from '../../log/multi-tasks-log';
import { defaultBuildWatchCmds, BuildWatchCmdsType } from './cmds';
import type { IBuildWatchConfig } from '.';

const getFinalTaskCmds = (
  taskCmds: BuildWatchCmdsType,
  project: IProjectNode,
) => {
  let finalTaskCmds: string[] = [];
  // case1: ["build"]
  // case2: ["dev", "build"]
  // case3: ["dev", () => []]
  // default: ['dev', 'build']
  if (taskCmds.length === 1) {
    finalTaskCmds = [taskCmds[0]];
  } else if (
    taskCmds.length === 2 &&
    typeof taskCmds[0] === 'string' &&
    typeof taskCmds[1] === 'string'
  ) {
    finalTaskCmds = [taskCmds[1]];
  } else if (
    taskCmds.length === 2 &&
    typeof taskCmds[0] === 'string' &&
    typeof taskCmds[1] === 'function'
  ) {
    finalTaskCmds = taskCmds[1](project);
  } else {
    // 如果以上为满足，则默认使用build
    finalTaskCmds = ['build'];
  }

  return finalTaskCmds;
};

export const createDependenciesTask = (
  config: IBuildWatchConfig,
  taskCmds: BuildWatchCmdsType = defaultBuildWatchCmds,
  taskLogger: MultitasksLogger,
) => {
  const { packageManager } = config;
  const timelogInstance = timeLog.initTimeLog();
  const task = async (project: IProjectNode) => {
    const finalTaskCmds: string[] = getFinalTaskCmds(taskCmds, project);
    const cmd = project.extra.scripts || {};

    for (const taskCmd of finalTaskCmds) {
      if (cmd[taskCmd]) {
        const prefix = `run ${project.name} ${taskCmd} script`;
        timeLog.startTime(timelogInstance, prefix);
        try {
          const childProcess = execa(packageManager, [taskCmd], {
            cwd: project.extra.path,
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          taskLogger.addLogProvider(project.name, {
            stdout: childProcess.stdout,
            stderr: childProcess.stderr,
            logConfig: { label: 'WATCH: ' },
          });

          await childProcess;
        } catch (e: any) {
          errorLog(project.name, e);
        }
        timeLog.endTime(timelogInstance, prefix);
      } else {
        logger.info(`${project.name} not have ${taskCmd}, skip it.`);
      }
    }
  };

  return task;
};

export const createDevTask = (
  config: IBuildWatchConfig,
  taskCmds: BuildWatchCmdsType = defaultBuildWatchCmds,
  taskLogger: MultitasksLogger,
) => {
  const { packageManager } = config;
  const task = async (project: IProjectNode) => {
    const devCmds = [taskCmds[0]];
    const cmd = project.extra.scripts || {};

    for (const taskCmd of devCmds) {
      if (cmd[taskCmd]) {
        // const prefix = `run ${project.name} ${taskCmd} script`;
        // log.info(prefix);
        try {
          const childProcess = execa(packageManager, [taskCmd], {
            cwd: project.extra.path,
            stdio: 'pipe',
            all: true,
          });

          taskLogger.addLogProvider(project.name, {
            stdout: childProcess.stdout,
            stderr: childProcess.stderr,
            logConfig: { label: `${taskCmd.toUpperCase()}: ` },
          });

          const ret = await childProcess;
          console.info(ret);
        } catch (e: any) {
          errorLog(project.name, e);
        }
      } else {
        logger.info(`${project.name} not have ${taskCmd}, skip it.`);
      }
    }
  };

  return task;
};
