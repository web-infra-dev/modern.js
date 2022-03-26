import type { PluginAPI } from '@modern-js/core';
import { Command } from 'commander';
import { install, IInstallCommandOption } from '../commands';

export const installCli = (program: Command, api: PluginAPI) => {
  program
    .command('install [project...]')
    .usage('[options]')
    .description('install deps for some projects')
    .action(
      async (installProjectNames: string[], option: IInstallCommandOption) => {
        await install(installProjectNames, option, api);
      },
    );
};
