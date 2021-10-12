import { Import } from '@modern-js/utils';
import chalk from 'chalk';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const inquirer: typeof import('inquirer') = Import.lazy('inquirer', require);
const color: typeof import('../../utils/color') = Import.lazy(
  '../../utils/color',
  require,
);

export interface IDevConfig {
  appDirectory: string;
  isTsProject: boolean;
}

export type DevTaskType = 'storybook' | 'docsite' | 'unknow';

export const showMenu = async (config: IDevConfig) => {
  const metas = await (core.mountHook() as any).moduleToolsMenu(undefined);
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

export const devStorybook = async (config: IDevConfig) => {
  const metas = await (core.mountHook() as any).moduleToolsMenu(undefined);
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
