import type { Command } from '@modern-js/utils';
import { MonorepoNewAction } from '@modern-js/new-action';
import { i18n, localeKeys } from '../locale';

export const newCli = (program: Command, locale?: string) => {
  program
    .command('new')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.new.describe))
    .option('-d, --debug', i18n.t(localeKeys.command.new.debug), false)
    .option('-c, --config <config>', i18n.t(localeKeys.command.new.config))
    .option(
      '-p, --plugin <plugin>',
      i18n.t(localeKeys.command.new.plugin),
      (val: string, memo: string[]) => {
        memo.push(val);
        return memo;
      },
      [],
    )
    .option('--dist-tag <tag>', i18n.t(localeKeys.command.new.distTag))
    .option('--registry', i18n.t(localeKeys.command.new.registry))
    .action(async options => {
      await MonorepoNewAction({ ...options, locale });
    });
};
