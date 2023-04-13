import { Command } from '@modern-js/utils';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { Options, upgradeAction } from './upgrade';
import { i18n, localeKeys } from './locale';

export { upgradeAction };

export type { Options };

export function defineCommand(program: Command) {
  const locale = getLocaleLanguage();
  i18n.changeLanguage({ locale });
  program
    .description(i18n.t(localeKeys.command.describe))
    .option('--dist-tag <distTag>', i18n.t(localeKeys.command.distTag), '')
    .option('--registry <registry>', i18n.t(localeKeys.command.registry), '')
    .option('-d,--debug', i18n.t(localeKeys.command.debug), false)
    .option('--cwd <cwd>', i18n.t(localeKeys.command.cwd), '')
    .action(upgradeAction);
}

export default function () {
  const program = new Command();
  defineCommand(program);
  program.parse(process.argv);
}
