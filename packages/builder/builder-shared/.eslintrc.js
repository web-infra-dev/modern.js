/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'vitest.config.ts'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
  rules: {
    'import/order': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    'eslint-comments/no-unlimited-disable': 0,
  },
};
