import { Import, chalk } from '@modern-js/utils';
import type { LoggerText } from './logger';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const execa: typeof import('execa') = Import.lazy('execa', require);
const lg: typeof import('./logger') = Import.lazy('./logger', require);
const pMap: typeof import('p-map') = Import.lazy('p-map', require);

export type Platform = 'all' | 'docs' | 'storybook';

export interface IBuildPlatformOption {
  platform: Platform;
  isTsProject?: boolean;
}

export const buildPlatform = async (option: IBuildPlatformOption) => {
  const { isTsProject = false, platform } = option;
  const lm = new lg.LoggerManager();
  // 获取platforms的参数
  const buildTasks = await (core.mountHook() as any).platformBuild({
    isTsProject,
  });

  if (buildTasks.length <= 0) {
    console.info(
      chalk.yellow(
        'No build tasks detected.\nYou can use the `new` command to enable the more features',
      ),
    );
    return;
  }

  const loggerMap: Record<string, LoggerText> = {};
  const taskMapper = buildTasks
    .filter((task: any) => platform === 'all' || task.name === platform)
    .map((params: any) => {
      const logger = lm.createLoggerText({ title: params.title });
      loggerMap[params.name] = logger;
      return {
        logger,
        ...params,
      };
    });

  if (taskMapper.length <= 0) {
    console.info(chalk.yellow(`'${platform}' is undefined task`));
    return;
  }

  lm.showCompiling();
  await pMap(taskMapper, async ({ taskPath, params, logger }: any) => {
    const childProcess = execa.node(taskPath, params, {
      stdio: 'pipe',
      all: true,
    });

    lm.addStdout(logger, childProcess.stdout, {
      event: { data: true, error: true },
    });

    lm.addStderr(logger, childProcess.stderr);

    await childProcess;
    // lm.disappearCompiling();
    // console.info(lg.colors.title(title));
    // console.info(a.all);
  });

  lm.disappearCompiling();
  for (const key of Object.keys(loggerMap)) {
    console.info(loggerMap[key].value);
  }
};
