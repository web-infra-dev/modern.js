module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/packages/**/src/**/*.ts',
    '!<rootDir>/packages/**/generators/src/**/*.ts',
    '!<rootDir>/packages/**/toolkit/create/src/**/*.ts',
  ],
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
    // TODO: 后续 unbundle 不再维护，需和插件一起移除
    'packages/cli/plugin-unbundle/*',
  ],
};
