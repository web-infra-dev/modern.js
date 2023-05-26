const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!(@modern-js-reduck|@babel))',
  ],
};
