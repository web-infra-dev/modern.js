// eslint-disable-next-line node/no-unsupported-features/node-builtins
const { TextEncoder, TextDecoder } = require('util');
const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  globals: {
    TextEncoder,
    TextDecoder,
  },
  moduleNameMapper: {
    '^@base/(.*)$': '<rootDir>/src/base/$1',
  },
};
