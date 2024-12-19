const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  moduleNameMapper: {
    '^@meta/runtime$': '<rootDir>/node_modules/@modern-js/runtime/src',
    '^@modern-js/runtime/browser$':
      '<rootDir>/node_modules/@modern-js/runtime/src/core/browser',
    '^@modern-js/runtime/react$':
      '<rootDir>/node_modules/@modern-js/runtime/src/core/react',
  },
};
