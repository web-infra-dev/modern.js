module.exports = {
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  testEnvironment: 'jest-environment-puppeteer',
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
  testRegex: 'e2e\\/.+\\.test.ts$',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageReporters: ['json', 'json-summary', 'lcov', 'text', 'clover'],
  collectCoverageFrom: ['src/*.ts'],
  watchPlugins: [
    // 'jest-watch-typeahead/filename',
    // 'jest-watch-typeahead/testname',
  ],
  verbose: false,
  testTimeout: 10000,
};
