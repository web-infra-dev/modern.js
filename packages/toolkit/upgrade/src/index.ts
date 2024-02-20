import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { Command } from '@modern-js/utils/commander';
import type { Options } from './upgrade';
import { i18n, localeKeys } from './locale';

export type { Options };

export function defineCommand(program: Command) {
  const locale = getLocaleLanguage();
  i18n.changeLanguage({ locale });
  program
    .description(i18n.t(localeKeys.command.describe))
    .option('-c --config <config>', i18n.t(localeKeys.command.config))
    .option('--dist-tag <distTag>', i18n.t(localeKeys.command.distTag), '')
    .option('--registry <registry>', i18n.t(localeKeys.command.registry), '')
    .option('-d,--debug', i18n.t(localeKeys.command.debug), false)
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
