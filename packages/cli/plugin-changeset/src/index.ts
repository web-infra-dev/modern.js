import type { CliPlugin } from '@modern-js/core';
import { change, bump, pre, release, status, genReleaseNote } from './commands';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils';

export * from './commands';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-changeset',

  setup: () => {
    // initial cli language
    i18n.changeLanguage({ locale: getLocaleLanguage() });

    return {
      plugins() {
        return [{}];
      },
      commands({ program }) {
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
            '--ignore <package>',
            i18n.t(localeKeys.command.bump.ignore),
            (val: string, memo: string[]) => {
              memo.push(val);
              return memo;
            },
            [],
          )
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
          .option('--otp <token>', i18n.t(localeKeys.command.release.otp), '')
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

        program
          .command('change-status')
          .description(i18n.t(localeKeys.command.status.describe))
          .option('--verbose', i18n.t(localeKeys.command.status.verbose))
          .option('--output <file>', i18n.t(localeKeys.command.status.output))
          .option('--since <ref>', i18n.t(localeKeys.command.status.since))
          .action((options: any) => status(options));

        program
          .command('gen-release-note')
          .description(i18n.t(localeKeys.command.gen_release_note.describe))
          .option(
            '--repo <repo>',
            i18n.t(localeKeys.command.gen_release_note.repo),
          )
          .option(
            '--custom <cumtom>',
            i18n.t(localeKeys.command.gen_release_note.custom),
          )
          .action((options: any) => genReleaseNote(options));
      },
    };
  },
});
