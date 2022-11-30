const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  setupFiles: ['../../../.jest/setEnvVars.js'],
  rootDir: __dirname,
};
