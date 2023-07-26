module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['index.d.ts'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
