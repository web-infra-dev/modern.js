import type { PluginAPI } from '@modern-js/core';
import type { Command } from '@modern-js/utils';
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
