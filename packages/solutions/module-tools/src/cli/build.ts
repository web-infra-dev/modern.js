import { Import, Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { IBuildCommandOption } from '../commands/build';

const local: typeof import('../locale') = Import.lazy(
  '../locale/index',
  require,
);
const command: typeof import('../commands/build') = Import.lazy(
  '../commands/build',
  require,
);

export const buildCli = (program: Command, api: PluginAPI) => {
  return (
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
        '-p, --platform [platform]',
        local.i18n.t(local.localeKeys.command.build.platform),
      )
      // @deprecated
      // The `--no-tsc` option has been superceded by the `--no-dts` option.
      .option('--no-tsc', local.i18n.t(local.localeKeys.command.build.no_tsc))
      .option('--dts', local.i18n.t(local.localeKeys.command.build.dts))
      .option(
        '--no-clear',
        local.i18n.t(local.localeKeys.command.build.no_clear),
      )
      .option(
        '-c --config <config>',
        local.i18n.t(local.localeKeys.command.build.config),
      )
      .action(async (subCommand: IBuildCommandOption) => {
        await command.build(api, subCommand);
      })
  );
};
