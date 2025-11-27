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
        '^@meta/runtime$': '<rootDir>/packages/runtime/plugin-runtime/src',
        '^@meta/runtime/context$':
          '<rootDir>/packages/runtime/plugin-runtime/src/core/context',
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
        '<rootDir>/packages/cli/babel-preset/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/solutions/module-tools/compiled/',
        '<rootDir>/packages/toolkit/utils/compiled/',
        '<rootDir>/.nx-cache',
        '<rootDir>/.nx',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/packages/builder/',
        '<rootDir>/packages/babel-preset/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/(server|solutions)/',
        '<rootDir>/packages/(server|solutions)/',
        '<rootDir>/packages/generator/',
        '<rootDir>/packages/runtime/plugin-runtime/',
        '<rootDir>/packages/cli/plugin-ssg/',
        '<rootDir>/packages/toolkit/plugin/',
        '<rootDir>/packages/toolkit/compiler/babel/',
        '<rootDir>/packages/toolkit/i18n-utils/',
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: '<rootDir>/tests/jest.env.js',
      testMatch: [
        '<rootDir>/packages/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/**/tests/**/*.test.[jt]s?(x)',
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
      testPathIgnorePatterns: [
        '<rootDir>/packages/builder/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/generator/',
        '<rootDir>/packages/server/babel-plugin-module-resolver/',
        '<rootDir>/packages/server/core/',
        '<rootDir>/packages/server/bff-runtime/',
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/server/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/solutions/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/server/**/tests/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/solutions/**/tests/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/runtime/plugin-runtime/',
      ],
    },
  ],
};
