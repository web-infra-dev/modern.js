module.exports = {
  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  extends: [
    // https://github.com/prettier/eslint-plugin-prettier
    'plugin:prettier/recommended',
  ],
  rules: {
    /**
     * Enable some rules disabled by eslint-config-prettier
     * @Warning : rules bellow can conflict with Prettier in some situations
     */
    // https://github.com/prettier/eslint-config-prettier#curly
    curly: 'error',
    // https://github.com/prettier/eslint-config-prettier#no-tabs
    'no-tabs': 'error',
  },
  overrides: [
    // ignore auto-generated css module declarations
    {
      files: ['*.css.d.ts'],
      rules: {
        'prettier/prettier': 'off',
      },
    },
  ],
};
