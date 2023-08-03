module.exports = {
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'jest-puppeteer',
  rootDir: __dirname,
  setupFilesAfterEnv: ['./utils/jest.setup.js'],
  testMatch: ['<rootDir>/integration/**/*.(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/api-service-koa/api/',
    '/api-service-koa/dist',
    '/api/tests',
    '/libuild/',
  ],
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
  testEnvironment: './utils/puppeteer_environment.js',
  globalSetup: './utils/setup.js',
  globalTeardown: './utils/teardown.js',
  testSequencer: './utils/custom-sequencer.js',
};
