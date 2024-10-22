const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  moduleNameMapper: {
    '^@meta/runtime$': '<rootDir>/node_modules/@modern-js/runtime/src',
  },
};
