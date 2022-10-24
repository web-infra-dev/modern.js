const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/copy.test.[jt]s?(x)'],
};
