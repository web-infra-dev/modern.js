const sharedConfig = require('@scripts/jest-config');

console.info(sharedConfig.coveragePathIgnorePatterns);

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  ...sharedConfig,
  rootDir: __dirname,
};
