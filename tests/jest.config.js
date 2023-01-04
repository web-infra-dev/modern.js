module.exports = {
  collectCoverage: true,
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
  ],
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
};
