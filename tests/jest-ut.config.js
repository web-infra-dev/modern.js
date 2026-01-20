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
      moduleNameMapper: {
        '^@modern-js/runtime/browser$':
          '<rootDir>/packages/runtime/plugin-runtime/src/core/browser',
        '^@modern-js/runtime/react$':
          '<rootDir>/packages/runtime/plugin-runtime/src/core/react',
        '^@modern-js/runtime$':
          '<rootDir>/packages/runtime/plugin-runtime/src/index',
        '^@modern-js/plugin/runtime$':
          '<rootDir>/packages/toolkit/plugin/src/runtime/index',
        '^./async_storage$': './async_storage.server',
      },
      globals: {},
      resolver: '<rootDir>/tests/jest.resolver.js',
      transformIgnorePatterns: ['/node_modules/.pnpm/(?!(@babel))'],
      modulePathIgnorePatterns: [
        '<rootDir>/packages/cli/builder/',
        '<rootDir>/packages/cli/plugin-data-loader/',
        '<rootDir>/packages/cli/babel-preset/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/solutions/module-tools/compiled/',
        '<rootDir>/packages/toolkit/utils/compiled/',
        '<rootDir>/.nx-cache',
        '<rootDir>/.nx',
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: '<rootDir>/tests/jest.env.js',
      testMatch: [
        '<rootDir>/packages/cli/plugin-bff/tests/**/*.test.[jt]s?(x)',
      ],
    },
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
        '<rootDir>/packages/server/utils/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/runtime/plugin-runtime/',
      ],
    },
  ],
};
