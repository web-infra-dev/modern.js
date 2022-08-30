import { Command } from '@modern-js/utils';
import { upgradeAction } from './upgrade';
import { i18n, localeKeys } from './locale';

export default function () {
  const program = new Command();

  program
    .description(i18n.t(localeKeys.command.describe))
    .option('--dist-tag <distTag>', i18n.t(localeKeys.command.distTag), '')
    .option('--registry <registry>', i18n.t(localeKeys.command.registry), '')
    .option('-d,--debug', i18n.t(localeKeys.command.debug), false)
    .option('--cwd <cwd>', i18n.t(localeKeys.command.cwd), '');

  program.action(upgradeAction);
  program.parse(process.argv);
}
