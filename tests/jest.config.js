module.exports = {
  collectCoverage: false,
  preset: 'jest-puppeteer',
  rootDir: __dirname,
  setupFilesAfterEnv: ['./utils/jest.setup.js'],
  testMatch: [
    '<rootDir>/integration/**/*.(spec|test).[tj]s?(x)',
    '!**/module/**/*.(spec|test).[tj]s?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/api/tests'],
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
  testEnvironment: './utils/puppeteer_environment.js',
  globalSetup: './utils/setup.js',
  globalTeardown: './utils/teardown.js',
  testSequencer: './utils/custom-sequencer.js',
  moduleNameMapper: {
    '^import-meta-resolve$': '<rootDir>/utils/mocks/import-meta-resolve.js',
  },
};
