const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  setupFiles: ['../../../tests/setEnvVars.js'],
  rootDir: __dirname,
  moduleNameMapper: {
    '^@modern-js/runtime/browser$': require.resolve(
      '@modern-js/runtime/browser',
    ),
    '^@modern-js/runtime/react$': require.resolve('@modern-js/runtime/react'),
    '^@modern-js/runtime/context$': require.resolve(
      '@modern-js/runtime/context',
    ),
    '^@modern-js/runtime$': require.resolve('@modern-js/runtime'),
  },
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!(@modern-js-reduck|@babel))',
  ],
};
