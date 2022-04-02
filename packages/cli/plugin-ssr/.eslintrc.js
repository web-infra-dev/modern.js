module.exports = {
  extends: ['@modern-js'],
  parserOptions: {
    project: require.resolve('./tsconfig.lint.json'),
  },
};
