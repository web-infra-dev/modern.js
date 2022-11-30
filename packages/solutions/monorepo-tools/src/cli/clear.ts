import type { Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { clear, IClearCommandOption } from '../commands';
import { MonorepoTools } from '../type';

export const clearCli = (program: Command, api: PluginAPI<MonorepoTools>) => {
  program
    .command('clear [projects...]')
    .usage('[options]')
    .option('--remove-dirs [dirs...]', 'remove dirs, default is node_modules')
    .description('clear project dirs')
    .action(
      async (targetProjectNames: string[], option: IClearCommandOption) => {
        await clear(targetProjectNames, option, api);
      },
    );
};
