const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  globals: {
    // FIXME: inject Headers polyfill
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@base/(.*)$': '<rootDir>/src/base/$1',
  },
};
