import type { Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { deploy } from '../commands';
import type { IDeployCommandOption } from '../commands';

export const deployCli = (program: Command, api: PluginAPI) => {
  program
    .command('deploy [project...]')
    .usage('[options]')
    .option(
      '-p, --path [path]',
      'Specify the path of the product output',
      'output',
    )
    .description('deploy project')
    .action(
      async (deployProjectNames: string[], option: IDeployCommandOption) => {
        // 在查找 workspace 下项目时，默认忽略 output 下面的项目
        const ignoreMatchs = ['**/output/**'];
        await deploy(api, deployProjectNames, option, ignoreMatchs);
      },
    );
};
