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
      snapshot: 'create a special kind of publishing for testing',
      ignore: 'skip packages from being published',
    },
    pre: {
      describe: 'enters and exits pre mode',
    },
    publish: {
      describe: 'publish changes to npm',
      tag: 'publish use special tag',
    },
  },
};
