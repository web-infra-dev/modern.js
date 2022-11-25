const devDependencyPaths = Object.keys(
  require('./package.json').devDependencies,
);

const withAllowTypeImports = key => pkg => ({
  [key]: pkg,
  allowTypeImports: true,
});

/**
 * @refer https://eslint.org/docs/latest/rules/no-restricted-imports
 * @refer https://typescript-eslint.io/rules/no-restricted-imports
 */
const restrictedImportInSource = {
  paths: [
    'webpack',
    'lodash',
    'ts-loader',
    'typescript',
    '@modern-js/utils',
    ...devDependencyPaths,
  ].map(withAllowTypeImports('name')),
  patterns: [
    'src/**/*',
    '**/stub',
    '**/stub/*',
    '**/plugins/*',
    '**/webpackPlugins/*',
    '*-webpack-plugin',
    [
      '@modern-js/utils/*',
      '!@modern-js/utils/chalk',
      '!@modern-js/utils/lodash',
      '!@modern-js/utils/chain-id',
    ],
  ].map(withAllowTypeImports('group')),
};

const restrictedImportInTypes = {
  patterns: [{ group: '**', allowTypeImports: true }],
};

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'vitest.config.ts'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
  rules: {
    'import/order': 0,
    '@babel/no-invalid-this': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    'eslint-comments/no-unlimited-disable': 0,
  },
  overrides: [
    {
      files: ['./src/types/**/*.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          restrictedImportInTypes,
        ],
      },
    },
    {
      files: ['./src/**/*.{ts,js}'],
      excludedFiles: [
        './src/webpackPlugins/**/*',
        '**/*.test.*',
        './src/types/**/*',
        './src/stub/**/*',
      ],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          restrictedImportInSource,
        ],
      },
    },
  ],
};
