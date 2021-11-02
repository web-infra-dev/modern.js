import { createPlugin } from '@modern-js/core';
import { change, bump, pre, release } from './commands';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils';

export default createPlugin(
  () => {
    // initial cli language
    i18n.changeLanguage({ locale: getLocaleLanguage() });

    return {
      plugins() {
        return [{}];
      },
      commands({ program }: any) {
        program
          .command('change')
          .description(i18n.t(localeKeys.command.change.describe))
          .option('--empty', i18n.t(localeKeys.command.change.empty), false)
          .option('--open', i18n.t(localeKeys.command.change.open), false)
          .action((options: any) => change(options));

        program
          .command('bump')
          .description(i18n.t(localeKeys.command.bump.describe))
          .option('--canary', i18n.t(localeKeys.command.bump.canary), false)
          .option(
            '--preid <tag>',
            i18n.t(localeKeys.command.bump.preid),
            'next',
          )
          .option(
            '--snapshot [snapshot]',
            i18n.t(localeKeys.command.bump.snapshot),
            false,
          )
          .action((options: any) => bump(options));

        program
          .command('pre <enter|exit> [tag]')
          .description(i18n.t(localeKeys.command.pre.describe))
          .action((type: 'enter' | 'exit', tag?: string) => pre(type, tag));

        program
          .command('release')
          .description(i18n.t(localeKeys.command.release.describe))
          .option('--tag <tag>', i18n.t(localeKeys.command.release.tag), '')
          .option(
            '--ignore-scripts',
            i18n.t(localeKeys.command.release.ignore_scripts),
            '',
          )
          .option(
            '--no-git-checks',
            i18n.t(localeKeys.command.release.no_git_checks),
            '',
          )
          .action((options: any) => release(options));
      },
    };
  },
  { name: '@modern-js/plugin-changeset' },
) as any;
