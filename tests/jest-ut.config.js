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
        '<rootDir>/packages/(server|solutions)/',
        '<rootDir>/packages/(server|solutions)/',
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
      ],
      rootDir: path.join(__dirname, '../'),
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/(server|solutions)/**/src/**/*.test.[jt]s?(x)',
        '<rootDir>/packages/(server|solutions)/**/tests/**/*.test.[jt]s?(x)',
      ],
    },
  ],
};
