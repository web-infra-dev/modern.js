const path = require('path');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.[jt]s?(x)'],
  coveragePathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  transform: {
    '\\.[jt]sx?$': [
      require.resolve('esbuild-jest'),
      {
        sourcemap: true,
      },
    ],
  },
  moduleNameMapper: {},
  globals: {},
  testEnvironment: 'jsdom',
  resolver: path.join(__dirname, 'jest.resolver.js'),
  rootDir: __dirname,
  testTimeout: 15000,
  testMatch: [
    '<rootDir>/src/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/**/*.test.[jt]s?(x)',
  ],
  modulePathIgnorePatterns: [],
};
