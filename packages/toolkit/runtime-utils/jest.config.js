const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  moduleNameMapper: {
    '^./async_storage$': './async_storage.server',
  },
};
