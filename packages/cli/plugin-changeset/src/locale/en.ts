export const EN_LOCALE = {
  command: {
    change: {
      describe: 'create changeset',
      empty: 'create an empty changeset',
      open: 'opens the created changeset in an external editor',
      no_packages:
        'not find sub-project，please use `{packageManager} new` to create sub-project',
    },
    bump: {
      describe: 'auto update publish version and changelog using changeset',
      canary: 'create a prerelease version of publishing for testing',
      preid: 'specify the identifier when versioning a prerelease',
      snapshot: 'create a snapshot version of publishing for testing',
      ignore: 'skip packages from being published',
    },
    pre: {
      describe: 'enters and exits pre mode',
    },
    release: {
      describe: 'publish changes to npm',
      tag: 'publish use special tag',
      otp: 'publish package use one-time password, if you have auth and writes enabled on npm ',
      ignore_scripts:
        'publish command ignore npm scripts, only can use in pnpm monorepo',
      no_git_checks:
        'publish command ignore checking if current branch is your publish branch, clean, and up-to-date, only can use in pnpm monorepo',
    },
    status: {
      describe:
        'provides information about the changesets that currently exist',
      verbose:
        'provides detail information about the changesets that currently exist with table',
      output:
        'write the information about the changesets that currently exist to json file',
      since:
        'only display information about changesets since a specific branch or git tag',
    },
    gen_release_note: {
      describe: 'generator release note info from changesets',
      repo: 'reponame to generator pull request link, like modern-js-dev/modern.js',
      custom: 'custom release note render rules',
    },
  },
};
