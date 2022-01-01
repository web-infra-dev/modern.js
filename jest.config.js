const path = require('path');

const kRootDir = __dirname;

function resolve(filepath) {
  return path.join(kRootDir, filepath);
}

module.exports = {
  collectCoverage: false,
  collectCoverageFrom: ['<rootDir>/packages/**/src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  transform: {
    '\\.[jt]sx?$': 'esbuild-jest',
  },
  moduleNameMapper: {},
  globals: {},
  testEnvironment: 'jsdom',
  resolver: resolve('/packages/cli/plugin-testing/src/cli/resolver.ts'),
  rootDir: kRootDir,
  testMatch: [
    '<rootDir>/packages/**/src/**/*.test.[jt]s?(x)',
    '<rootDir>/packages/**/tests/**/*.test.[jt]s?(x)',
  ],
  modulePathIgnorePatterns: [
    // TODO: 暂时无法解决（Property exprName of TSTypeQuery expected node to be of a type ["TSEntityName","TSImportType"] but instead got "MemberExpression"）问题，先绕过
    'packages/server/create-request/tests/node.test.ts',
  ],
};
