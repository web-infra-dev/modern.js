module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'jest-puppeteer',
  rootDir: __dirname,
  setupFilesAfterEnv: ['./utils/jest.setup.js'],
  testMatch: [
    '/Users/bytedance/Desktop/workspaces/modern.js/tests/integration/server-config/tests/index.test.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/api-service-koa/api/'],
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
};
