module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'fixtures/**', 'tests/**'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
