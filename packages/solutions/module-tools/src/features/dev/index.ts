import { chalk, Import, inquirer } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';

const color: typeof import('../../utils/color') = Import.lazy(
  '../../utils/color',
  require,
);

export interface IDevConfig {
  appDirectory: string;
  isTsProject: boolean;
}

export type DevTaskType = 'storybook' | 'docsite' | 'unknown';

export const showMenu = async (api: PluginAPI, config: IDevConfig) => {
  const runners: any = api.useHookRunners();
  const metas = await runners.moduleToolsMenu(undefined);
  if (metas.length <= 0) {
    console.info(
      chalk.yellow(
        'No runnable development features found.\nYou can use the `new` command to enable the development features',
      ),
    );
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
  const menuMessage = color.devMenuTitle('Select the debug mode:');
  const { type } = await inquirer.prompt([
    {
      name: 'type',
      message: menuMessage,
      type: 'list',
      choices: metas,
    },
  ]);

  const devMeta = metas.find((meta: any) => meta.value === type);
  if (devMeta) {
    await devMeta.runTask(config);
  }
};

export const devStorybook = async (api: PluginAPI, config: IDevConfig) => {
  const runners: any = api.useHookRunners();
  const metas = await runners.moduleToolsMenu(undefined);
  const findStorybook = metas.find((meta: any) => meta.value === 'storybook');
  if (findStorybook) {
    await findStorybook.runTask(config);
  } else {
    console.info(
      chalk.yellow(
        'No development features found.\nYou can use the `new` command to enable the development features',
      ),
    );
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
};

export const runSubCmd = async (
  api: PluginAPI,
  subCmd: string,
  config: IDevConfig,
) => {
  const runners: any = api.useHookRunners();
  const metas = await runners.moduleToolsMenu(undefined);

  const devMeta = metas.find(
    (meta: any) =>
      meta.value === subCmd ||
      (Array.isArray(meta.aliasValues) &&
        (meta.aliasValues as string[]).includes(subCmd)),
  );
  if (devMeta) {
    await devMeta.runTask(config);
  } else {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
};
