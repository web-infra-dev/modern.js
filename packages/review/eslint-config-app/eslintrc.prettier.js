module.exports = {
  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  extends: [
    './eslintrc.js',
    // https://www.npmjs.com/package/eslint-config-prettier
    // https://github.com/prettier/eslint-config-prettier/blob/master/index.js#L14
    'prettier',
  ],
  env: {
    commonjs: false,
    browser: true,
    node: false,
  },
  rules: {
    // https://github.com/prettier/eslint-config-prettier#curly
    curly: 'error',
    // https://github.com/prettier/eslint-config-prettier#max-len
    'max-len': [
      'error',
      {
        code: 80,
        tabWidth: 4,
        ignoreComments: true,
        ignoreTrailingComments: false,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    // https://github.com/prettier/eslint-config-prettier#no-confusing-arrow
    'no-confusing-arrow': 'off',
    // https://github.com/prettier/eslint-config-prettier#no-mixed-operators
    'no-mixed-operators': 'off',
    // https://github.com/prettier/eslint-config-prettier#no-tabs
    'no-tabs': 'error',
    // https://github.com/prettier/eslint-config-prettier#quotes
    quotes: 'off',
  },
  // https://eslint.org/docs/user-guide/configuring#configuration-based-on-glob-patterns
  // https://eslint.org/docs/user-guide/migrating-to-6.0.0#-overrides-in-an-extended-config-file-can-now-be-overridden-by-a-parent-config-file
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/type-annotation-spacing': 'off',
      },
    },
    {
      files: ['*.test.*', '__test__/*'],
      env: {
        mocha: true,
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
        '@babel/no-unused-expressions': 'off',
      },
    },
    {
      files: ['*.worker.*'],
      env: { worker: true },
    },
    {
      files: ['**/pages/**/_*', '**/pages/**/\\[**'],
      rules: {
        'filenames/match-regex': 'off',
        'filenames/match-exported': 'off',
      },
    },
    // ignore auto-generated css module declarations
    {
      files: ['*.css.d.ts'],
      rules: {
        'pre/match-regex': 'off',
        'filenames/match-exported': 'off',
        'prettier/prettier': 'off',
      },
    },
  ],
};
