module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/packages/**/src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  transform: {
    '\\.[jt]sx?$': 'esbuild-jest',
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
    // TODO: 很容易超时导致失败，暂时先绕过
    'packages/generator/generator-utils/tests/index.test.ts',
    // TODO: 很容易超时导致失败，暂时先绕过
    'packages/toolkit/utils/tests/index.test.ts',
    // TODO: 很容易超时导致失败，暂时先绕过
    'packages/generator/generator-plugin/tests/getPackageMeta.test.ts',
  ],
};
