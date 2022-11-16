const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/**/alias.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    'designSystem.test.ts',
    'build-watch.test.ts',
    'new-command.test.ts',
  ],
  coveragePathIgnorePatterns: ['onExit.ts', './src/constants/*'],
};
