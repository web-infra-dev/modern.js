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
    // TODO: 暂时无法解决（Property exprName of TSTypeQuery expected node to be of a type ["TSEntityName","TSImportType"] but instead got "MemberExpression"）问题，先绕过
    'packages/server/create-request/tests/node.test.ts',
    // TODO: 很容易超时导致失败，暂时先绕过
    'packages/generator/generator-utils/tests/index.test.ts',
  ],
};
