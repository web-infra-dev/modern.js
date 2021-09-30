import { Command } from 'commander';
import { clear, IClearCommandOption } from '../commands';

export const clearCli = (program: Command) => {
  program
    .command('clear [projects...]')
    .usage('[options]')
    .option('--remove-dirs [dirs...]', 'remove dirs, default is node_modules')
    .description('clear project dirs')
    .action(
      async (targetProjectNames: string[], option: IClearCommandOption) => {
        await clear(targetProjectNames, option);
      },
    );
};
