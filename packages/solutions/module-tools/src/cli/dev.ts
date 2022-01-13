import { Import } from '@modern-js/utils';
import type { Command } from 'commander';
import type { IDevOption } from '../commands/dev';

const local: typeof import('../locale') = Import.lazy('../locale', require);
const commands: typeof import('../commands') = Import.lazy(
  '../commands',
  require,
);

export const devCli = (program: Command) => {
  program
    .command('dev')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.dev.describe))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.build.tsconfig),
      './tsconfig.json',
    )
    .action(async (params: IDevOption) => {
      await commands.dev(params);
    });
};
