import { Command } from '@modern-js/utils';
import { createAction } from './createAction';
import { getLocaleLanguage } from './utils';
import { i18n, localeKeys } from './locale';

export default function () {
  // initial cli language
  i18n.changeLanguage({ locale: getLocaleLanguage() });

  const program = new Command();

  program
    .usage('[projectDir]')
    .description(i18n.t(localeKeys.command.description))
    .argument('[projectDir]')
    .option('-c, --config <config>', i18n.t(localeKeys.command.config), '{}')
    .option('--mwa', i18n.t(localeKeys.command.mwa), false)
    .option('--module', i18n.t(localeKeys.command.module), false)
    .option('--monorepo', i18n.t(localeKeys.command.monorepo), false)
    .option(
      '-p, --plugin <plugin>',
      i18n.t(localeKeys.command.plugin),
      (val: string, memo: string[]) => {
        memo.push(val);
        return memo;
      },
      [],
    )
    .option('--dist-tag <distTag>', i18n.t(localeKeys.command.distTag), '')
    .option('--registry <registry>', i18n.t(localeKeys.command.registry), '')
    .option('-d,--debug', i18n.t(localeKeys.command.debug), false)
    .action(createAction);

  program.parse(process.argv);
}
