const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  setupFiles: ['./test-setup.js'],
  rootDir: __dirname,
};
