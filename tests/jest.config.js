module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'jest-puppeteer',
  rootDir: __dirname,
  setupFilesAfterEnv: ['./utils/jest.setup.js'],
  testMatch: [
    '/Users/bytedance/Desktop/workspace/modern.js/tests/integration/routes/tests/index.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/api-service-koa/api/',
    '/api-service-koa/dist',
  ],
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
};
