/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['vitest.config.ts', 'tests/fixtures/', 'example/'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
