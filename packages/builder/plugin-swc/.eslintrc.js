module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'fixtures/**', 'tests/**', 'vitest.config.ts'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
