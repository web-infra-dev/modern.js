const path = require('path');
const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  setupFiles: [path.resolve(__dirname, 'tests/setup')],
  testEnvironment: 'node',
  rootDir: __dirname,
};
