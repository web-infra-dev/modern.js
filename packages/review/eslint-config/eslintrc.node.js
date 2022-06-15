const { jsExtensions } = require('@modern-js-app/eslint-config/utils');

module.exports = {
  env: {
    commonjs: false,
    browser: false,
    node: true,
  },
  settings: { 'import/resolver': 'node' },
  ignorePatterns: ['tests/cypress/**/*'],
  rules: {
    'node/no-unsupported-features/es-builtins': 2,
    // disable the rule for out of date reason, refer to: https://github.com/mysticatea/eslint-plugin-node/issues/216
    'node/no-unsupported-features/es-syntax': 0,
    'node/no-unsupported-features/node-builtins': 2,
    'node/prefer-global/url': [2, 'never'],
    'node/prefer-global/url-search-params': [2, 'never'],
    'node/prefer-global/buffer': [2, 'never'],
    'node/prefer-global/text-decoder': [2, 'never'],
    'node/prefer-global/text-encoder': [2, 'never'],
    'node/process-exit-as-throw': 2,
    'node/no-deprecated-api': 2,
    'node/prefer-promises/dns': 2,
    // https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V11.md#11.14.0
    // https://github.com/nodejs/Release
    'node/prefer-promises/fs': 0,
    // 'node/prefer-promises/fs': 2,
    'filenames/match-regex': 0,
    'import/default': 0,
    'import/no-dynamic-require': 0,
    'import/no-unused-modules': 0,
    'import/no-commonjs': 0,
  },
  overrides: [
    {
      files: ['*.ts', '*.d.ts', '*.tsx'],
      // https://github.com/benmosher/eslint-plugin-import/blob/master/config/typescript.js
      settings: {
        'import/external-module-folders': [
          'node_modules',
          'node_modules/@types',
        ],
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
        },
        'import/resolver': { node: { extensions: jsExtensions } },
      },
      rules: {
        // https://github.com/benmosher/eslint-plugin-import/blob/master/config/typescript.js
        'import/named': 'off',
        'node/no-unsupported-features/es-syntax': 0,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/no-require-imports': 0,
      },
    },
  ],
};
