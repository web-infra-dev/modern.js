import type { PluginAPI } from '@modern-js/core';
import type { DevCommandOptions } from './types/command';
import type { ModuleContext } from './types/context';
import type { DevToolData, ModuleToolsHooks } from './types/hooks';

export const showMenu = async (
  metas: DevToolData[],
  devCmdOptions: DevCommandOptions,
  api: PluginAPI<ModuleToolsHooks>,
  context: ModuleContext,
) => {
  const { chalk, inquirer } = await import('@modern-js/utils');
  const runner = api.useHookRunners();

  const menuTitle = chalk.rgb(255, 153, 0);
  const choices = metas
    .map(meta => meta.menuItem)
    .filter(menuItem => typeof menuItem === 'object');
  const question = [
    {
      name: 'choiceDevTool',
      message: menuTitle('Select the debug mode:'),
      type: 'list',
      choices,
    },
  ];

  const newQuestion = await runner.beforeDevMenu(question);
  const result: { choiceDevTool: string } = await inquirer.prompt(
    newQuestion ?? question,
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
  api: PluginAPI<ModuleToolsHooks>,
  context: ModuleContext,
) => {
  const { chalk } = await import('@modern-js/utils');
  const { purple } = await import('./constants/colors');
  if (metas.length === 0) {
    console.info('没有发现可用的调试工具');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  const runner = api.useHookRunners();
  if (metas.length === 1) {
    console.info(
      chalk.rgb(...purple)(
        `当前检测到仅有一个调试工具可用，直接运行 ${
          metas[0].menuItem?.name ?? metas[0].name
        }`,
      ),
    );
    const meta = metas[0];
    await runner.beforeDevTask(meta);
    await meta.action(options, { isTsProject: context.isTsProject });
  } else if (metas.length > 1) {
    await showMenu(metas, options, api, context);
  }
};
