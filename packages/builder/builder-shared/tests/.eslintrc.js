module.exports = {
  extends: ['@modern-js'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
  rules: {
    'node/prefer-global/console': ['off'],
  },
};
