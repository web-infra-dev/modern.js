import { Command } from '@modern-js/utils';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { createAction } from './createAction';
import { i18n, localeKeys } from './locale';
import { cleanCacheAction } from './cleanCacheAction';

export default function () {
  // initial cli language
  i18n.changeLanguage({ locale: getLocaleLanguage() });

  const program = new Command();

  program
    .command('clean-cache')
    .description(i18n.t(localeKeys.command.cleanCache))
    .action(cleanCacheAction);

  program
    .usage('[projectDir]')
    .description(i18n.t(localeKeys.command.description))
    .argument('[projectDir]')
    .option('--version', i18n.t(localeKeys.command.version))
    .option('--lang <lang>', i18n.t(localeKeys.command.lang))
    .option('-c, --config <config>', i18n.t(localeKeys.command.config), '{}')
    .option('-d,--debug', i18n.t(localeKeys.command.debug), false)
    .option('--mwa', i18n.t(localeKeys.command.mwa), false)
    .option('--module', i18n.t(localeKeys.command.module), false)
    .option('--monorepo', i18n.t(localeKeys.command.monorepo), false)
    .option('--generator <generator>', i18n.t(localeKeys.command.generator))
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
    .option('--packages <packages>', i18n.t(localeKeys.command.packages), '{}')
    .option('--registry <registry>', i18n.t(localeKeys.command.registry), '')
    .option('--no-need-install', i18n.t(localeKeys.command.noNeedInstall))
    .action(createAction);

  program.parse(process.argv);
}
