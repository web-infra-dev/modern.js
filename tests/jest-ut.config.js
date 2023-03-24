const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..'),
  setupFiles: ['<rootDir>/tests/setEnvVars.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/packages/**/src/**/*.ts',
    '!<rootDir>/packages/generator/generators/**/src/**/*.ts',
    '!<rootDir>/packages/**/toolkit/create/src/**/*.ts',
    '!<rootDir>/packages/**/toolkit/upgrade/src/**/*.ts',
    // exclude builder temporarily
    '!<rootDir>/packages/builder/**/src/**/*.ts',
    '!<rootDir>/packages/toolkit/e2e/**/*.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/fixtures/'],
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
    '<rootDir>/packages/builder/',
    '<rootDir>/packages/toolkit/e2e/',
    '<rootDir>/packages/cli/doc-core/',
    '<rootDir>/packages/toolkit/remark-container',
    '<rootDir>/packages/solutions/module-tools-v2/compiled/',
    '<rootDir>/packages/solutions/module-tools/compiled/',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/packages/builder/',
    '<rootDir>/packages/toolkit/e2e/',
  ],
};
