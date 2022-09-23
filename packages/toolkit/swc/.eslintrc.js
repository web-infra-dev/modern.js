module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'fixtures/**', '**/bench/*.js'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
