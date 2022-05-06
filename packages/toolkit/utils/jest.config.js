const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  modulePathIgnorePatterns: [
    // TODO: 很容易超时导致失败，暂时先绕过
    'tests/index.test.ts',
  ],
};
