module.exports = {
  setupFiles: ['<rootDir>/.jest/setEnvVars.js'],
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
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
        },
      },
    ],
  },
  moduleNameMapper: {},
  globals: {},
  testEnvironment: 'jsdom',
  resolver: '<rootDir>/jest.resolver.js',
  rootDir: __dirname,
  testTimeout: 15 * 1000,
  testMatch: [
    '<rootDir>/packages/**/src/**/*.test.[jt]s?(x)',
    '<rootDir>/packages/**/tests/**/*.test.[jt]s?(x)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/packages/builder/',
    '<rootDir>/packages/toolkit/e2e/',
    '<rootDir>/packages/cli/doc-core/',
    '<rootDir>/packages/solutions/module-tools-v2/compiled/',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/packages/builder/',
    '<rootDir>/packages/toolkit/e2e/',
  ],
};
