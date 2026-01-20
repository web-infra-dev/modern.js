const path = require('path');

module.exports = {
  collectCoverage: false,
  testTimeout: 30000,
  projects: [
    {
      setupFiles: ['<rootDir>/tests/setEnvVars.js'],
      transform: {
        '\\.[jt]sx?$': [
          require.resolve('@swc/jest'),
          {
            jsc: {
              parser: {
                syntax: 'typescript',
                decorators: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        ],
      },
      moduleNameMapper: {},
      globals: {},
      resolver: '<rootDir>/tests/jest.resolver.js',
      transformIgnorePatterns: ['/node_modules/.pnpm/(?!(@babel))'],
      modulePathIgnorePatterns: [
        '<rootDir>/packages/cli/builder/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/solutions/module-tools/compiled/',
        '<rootDir>/packages/toolkit/utils/compiled/',
        '<rootDir>/.nx-cache',
        '<rootDir>/.nx',
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/server/server/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/runtime/plugin-runtime/',
      ],
    },
  ],
};
