import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { Command } from 'commander';
import { i18n, localeKeys } from './locale';
import type { Options } from './upgrade';

export type { Options };

export function defineCommand(program: Command) {
  const locale = getLocaleLanguage();
  i18n.changeLanguage({ locale });
  program
    .alias('upgrade')
    .description(i18n.t(localeKeys.command.describe))
    .usage('npx @modern-js/upgrade [options]')
    .option('-c --config <config>', i18n.t(localeKeys.command.config))
    .option('--dist-tag <distTag>', i18n.t(localeKeys.command.distTag), '')
    .option(
      '--registry <registry>',
      i18n.t(localeKeys.command.registry),
      undefined,
    )
    .option('-d,--debug', i18n.t(localeKeys.command.debug), false)
    .option('--time', i18n.t(localeKeys.command.time), false)
    .option('--cwd <cwd>', i18n.t(localeKeys.command.cwd), '')
    .option('--no-need-install', i18n.t(localeKeys.command.noNeedInstall))
    .action(async params => {
      const { upgradeAction } = await import('./upgrade');
      return upgradeAction(params);
    });
}

export default () => {
  const program = new Command();
  defineCommand(program);
  program.parse(process.argv);
};
