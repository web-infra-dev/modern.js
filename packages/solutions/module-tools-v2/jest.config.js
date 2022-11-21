const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['buildWatch.test.ts'],
  coveragePathIgnorePatterns: ['onExit.ts', './src/constants/*'],
};
