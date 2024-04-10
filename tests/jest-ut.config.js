const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..'),
  setupFiles: ['<rootDir>/tests/setEnvVars.js'],
  collectCoverage: false,
  transform: {
    '\\.[jt]sx?$': [
      require.resolve('@swc/jest'),
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  moduleNameMapper: {},
  globals: {},
  testEnvironment: '<rootDir>/tests/jest.env.js',
  resolver: '<rootDir>/tests/jest.resolver.js',
  testTimeout: 30000,
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!(@modern-js-reduck|@babel))',
  ],
  testMatch: [
    '<rootDir>/packages/**/src/**/*.test.[jt]s?(x)',
    '<rootDir>/packages/**/tests/**/*.test.[jt]s?(x)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/packages/cli/uni-builder/',
    '<rootDir>/packages/toolkit/e2e/',
    '<rootDir>/packages/solutions/module-tools/compiled/',
    '<rootDir>/packages/toolkit/utils/compiled/',
    '<rootDir>/.nx-cache',
    '<rootDir>/.nx',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/packages/uni-builder/',
    '<rootDir>/packages/toolkit/e2e/',
  ],
};
