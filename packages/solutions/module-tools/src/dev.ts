import type { PluginAPI } from '@modern-js/core';
import { chalk, inquirer, logger } from '@modern-js/utils';
import type { DevCommandOptions } from './types/command';
import type { ModuleContext } from './types/context';
import type { DevToolData, ModuleTools } from './types';

export const showMenu = async (
  metas: DevToolData[],
  devCmdOptions: DevCommandOptions,
  api: PluginAPI<ModuleTools>,
  context: ModuleContext,
) => {
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
  const { green } = await import('./constants/color');
  const runner = api.useHookRunners();
  if (metas.length === 0) {
    const local = await import('./locale');
    const noDevToolsLog = await runner.noDevTools(
      local.i18n.t(local.localeKeys.log.dev.noDevtools),
    );

    logger.info(noDevToolsLog);
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  if (metas.length === 1) {
    logger.info(
      chalk.rgb(...green)(
        `Only one dev tooling is currently detected as available, run it directly [${
          metas[0].menuItem?.name ?? metas[0].name
        }]`,
      ),
    );
    const meta = metas[0];

    await runner.beforeDevTask(meta);
    await meta.action(options, { isTsProject: context.isTsProject });
  } else if (metas.length > 1) {
    await showMenu(metas, options, api, context);
  }
};
