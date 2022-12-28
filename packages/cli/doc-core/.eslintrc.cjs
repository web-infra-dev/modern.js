module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['runtime.d.ts', 'theme.d.ts'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
