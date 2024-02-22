const path = require('path');
const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  setupFiles: [path.resolve(__dirname, 'tests/setup.ts')],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@base/(.*)$': '<rootDir>/src/base/$1',
  },
};
