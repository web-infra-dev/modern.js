import { Import } from '@modern-js/utils';
import type { Command } from 'commander';
import type { IBuildOption } from '../commands/build';

const local: typeof import('../locale') = Import.lazy(
  '../locale/index',
  require,
);
const commands: typeof import('../commands') = Import.lazy(
  '../commands',
  require,
);

export const buildCli = (program: Command) => {
  // TODO: 初始化环境变量
  program
    .command('build')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.build.describe))
    .option('-w, --watch', local.i18n.t(local.localeKeys.command.build.watch))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.build.tsconfig),
      './tsconfig.json',
    )
    .option(
      '--style-only',
      local.i18n.t(local.localeKeys.command.build.style_only),
    )
    .option(
      '--platform [platform]',
      local.i18n.t(local.localeKeys.command.build.platform),
    )
    .option('--no-tsc', local.i18n.t(local.localeKeys.command.build.no_tsc))
    .option('--no-clear', local.i18n.t(local.localeKeys.command.build.no_clear))
    .action(async (subCommand: IBuildOption) => {
      await commands.build(subCommand);
    });
};
