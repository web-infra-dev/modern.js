import type { PluginAPI } from '@modern-js/core';
import type { DevCommandOptions, BuildCommandOptions } from './types/command';
import type { ModuleContext } from './types/context';
import type { DevToolData, ModuleTools } from './types';

export const runBuildBeforeDevTools = async (
  api: PluginAPI<ModuleTools>,
  context: ModuleContext,
  cliOptions: DevCommandOptions,
  options: {
    disableRunBuild: boolean;
    appDirectory: string;
  },
) => {
  if (!options.disableRunBuild) {
    const { build } = await import('./build');
    const defaultCmdOptions: BuildCommandOptions = {
      watch: true,
      tsconfig: cliOptions.tsconfig,
      dts: true,
      clear: true,
    };
    build(api, defaultCmdOptions, context);
  }
};

export const showMenu = async (
  metas: DevToolData[],
  devCmdOptions: DevCommandOptions,
  api: PluginAPI<ModuleTools>,
  context: ModuleContext,
) => {
  const { chalk, inquirer } = await import('@modern-js/utils');
  const runner = api.useHookRunners();

  const menuTitle = chalk.rgb(255, 153, 0);
  const choices = metas
    .map(meta => meta.menuItem)
    .filter(menuItem => typeof menuItem === 'object');
  const questions = [
    {
      name: 'choiceDevTool',
      message: menuTitle('选择调试工具'),
      type: 'list',
      choices,
    },
  ];

  const newQuestions = await runner.beforeDevMenu(questions);
  const result: { choiceDevTool: string } = await inquirer.prompt(
    newQuestions.length !== 0 ? newQuestions : questions,
  );
  await runner.afterDevMenu({ result, devTools: metas });

  const currentDevTool = metas.find(
    meta => meta.menuItem?.value === result.choiceDevTool,
  );
  if (currentDevTool) {
    await runBuildBeforeDevTools(api, context, devCmdOptions, {
      disableRunBuild: currentDevTool.disableRunBuild ?? false,
      appDirectory: context.appDirectory,
    });

    await runner.beforeDevTask(currentDevTool);
    await currentDevTool.action(devCmdOptions, {
      isTsProject: context.isTsProject,
    });
  }
};

export const dev = async (
  options: DevCommandOptions,
  metas: DevToolData[],
  api: PluginAPI<ModuleTools>,
  context: ModuleContext,
) => {
  const { chalk } = await import('@modern-js/utils');
  const { purple } = await import('./constants/colors');
  if (metas.length === 0) {
    console.info('No dev tools found available');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  const runner = api.useHookRunners();
  if (metas.length === 1) {
    console.info(
      chalk.rgb(...purple)(
        `Only one dev tooling is currently detected as available, run it directly [${
          metas[0].menuItem?.name ?? metas[0].name
        }]`,
      ),
    );
    const meta = metas[0];

    await runBuildBeforeDevTools(api, context, options, {
      disableRunBuild: meta.disableRunBuild ?? false,
      appDirectory: context.appDirectory,
    });

    await runner.beforeDevTask(meta);
    await meta.action(options, { isTsProject: context.isTsProject });
  } else if (metas.length > 1) {
    await showMenu(metas, options, api, context);
  }
};
