import type { Command } from '@modern-js/utils';
import { newAction } from '@modern-js/utils';
import { i18n, localeKeys } from '../locale';

export const newCli = (program: Command, locale?: string) => {
  program
    .command('new')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.new.describe))
    .option(
      '--config-file <configFile>',
      i18n.t(localeKeys.command.shared.config),
    )
    .option('--lang <lang>', i18n.t(localeKeys.command.new.lang))
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
    .option('-d, --debug', i18n.t(localeKeys.command.new.debug), false)
    .option('--dist-tag <tag>', i18n.t(localeKeys.command.new.distTag))
    .option('--registry', i18n.t(localeKeys.command.new.registry))
    .option(
      '--no-need-install',
      i18n.t(localeKeys.command.shared.noNeedInstall),
    )
    .action(async options => {
      await newAction(
        {
          ...options,
          locale: options.lang || locale,
        },
        'monorepo',
      );
    });
};
