import { Import, Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { IDevOption } from '../commands/dev';

const local: typeof import('../locale') = Import.lazy('../locale', require);
const commands: typeof import('../commands') = Import.lazy(
  '../commands',
  require,
);

export const devCli = (program: Command, api: PluginAPI) => {
  program
    .command('dev [subCmd]')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.dev.describe))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.build.tsconfig),
      './tsconfig.json',
    )
    .action(async (subCmd: string, params: IDevOption) => {
      await commands.dev(api, params, subCmd);
    });
};
