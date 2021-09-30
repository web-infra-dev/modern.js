import { Command } from 'commander';
import { deploy } from '../commands';
import type { IDeployCommandOption } from '../commands';

export const deployCli = (program: Command) => {
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
        await deploy(deployProjectNames, option);
      },
    );
};
