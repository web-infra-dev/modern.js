/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'vitest.config.ts', 'modern.config.ts'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
  rules: {
    'import/order': 0,
  },
};
