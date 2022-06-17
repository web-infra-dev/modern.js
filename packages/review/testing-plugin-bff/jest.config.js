const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  testEnvironment: 'node',
  coverageProvider: 'v8',
  rootDir: __dirname,
};
