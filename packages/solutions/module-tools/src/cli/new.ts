import { Import, Command } from '@modern-js/utils';

const newAction: typeof import('@modern-js/new-action') = Import.lazy(
  '@modern-js/new-action',
  require,
);
const local: typeof import('../locale') = Import.lazy('../locale', require);

export const newCli = (program: Command, locale?: string) => {
  program
    .command('new')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.new.describe))
    .option(
      '-d, --debug',
      local.i18n.t(local.localeKeys.command.new.debug),
      false,
    )
    .option(
      '-c, --config <config>',
      local.i18n.t(local.localeKeys.command.new.config),
    )
    .option(
      '--dist-tag <tag>',
      local.i18n.t(local.localeKeys.command.new.distTag),
    )
    .option('--registry', local.i18n.t(local.localeKeys.command.new.registry))
    .action(async options => {
      await newAction.ModuleNewAction({ ...options, locale });
    });
};
