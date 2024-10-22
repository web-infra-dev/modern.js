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
      },
      globals: {},
      resolver: '<rootDir>/tests/jest.resolver.js',
      transformIgnorePatterns: [
        '/node_modules/.pnpm/(?!(@modern-js-reduck|@babel))',
      ],
      modulePathIgnorePatterns: [
        '<rootDir>/packages/cli/uni-builder/',
        '<rootDir>/packages/cli/babel-preset/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/solutions/module-tools/compiled/',
        '<rootDir>/packages/toolkit/utils/compiled/',
        '<rootDir>/.nx-cache',
        '<rootDir>/.nx',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/packages/uni-builder/',
        '<rootDir>/packages/babel-preset/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/(server|solutions)/',
        '<rootDir>/packages/(server|solutions)/',
        '<rootDir>/packages/generator/',
        '<rootDir>/packages/cli/plugin-swc/',
        '<rootDir>/packages/runtime/plugin-runtime/',
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: '<rootDir>/tests/jest.env.js',
      testMatch: [
        '<rootDir>/packages/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/**/tests/**/*.test.[jt]s?(x)',
      ],
    },
    {
      setupFiles: [
        '<rootDir>/tests/setEnvVars.js',
        '<rootDir>/packages/server/core/tests/setup.ts',
        '<rootDir>/packages/server/plugin-koa/tests/setup.ts',
      ],
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
      transformIgnorePatterns: [
        '/node_modules/.pnpm/(?!(@modern-js-reduck|@babel))',
      ],
      modulePathIgnorePatterns: [
        '<rootDir>/packages/cli/uni-builder/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/solutions/module-tools/compiled/',
        '<rootDir>/packages/toolkit/utils/compiled/',
        '<rootDir>/.nx-cache',
        '<rootDir>/.nx',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/packages/uni-builder/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/generator/',
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/server/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/solutions/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/server/**/tests/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/solutions/**/tests/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/cli/plugin-swc/',
        '<rootDir>/packages/runtime/plugin-runtime/',
      ],
    },
    {
      setupFiles: [],
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
        '^@modern-js/generator-common$':
          '<rootDir>/packages/generator/generator-common/src',
        '^@modern-js/generator-utils$':
          '<rootDir>/packages/generator/generator-utils/src',
        '^@modern-js/generator-plugin$':
          '<rootDir>/packages/generator/generator-plugin/src',
        '^@modern-js/plugin-i18n$': '<rootDir>/packages/cli/plugin-i18n/src',
      },
      globals: {},
      transformIgnorePatterns: [],
      modulePathIgnorePatterns: [
        '<rootDir>/packages/cli/uni-builder/',
        '<rootDir>/packages/toolkit/e2e/',
        '<rootDir>/packages/solutions/module-tools/compiled/',
        '<rootDir>/packages/toolkit/utils/compiled/',
        '<rootDir>/.nx-cache',
        '<rootDir>/.nx',
      ],
      testPathIgnorePatterns: [],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/generator/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/generator/**/tests/**/*.test.[jt]s?(x)',
      ],
    },
  ],
};
