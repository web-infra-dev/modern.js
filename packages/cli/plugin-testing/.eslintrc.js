module.exports = {
  extends: ['@modern-js'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
  ignorePatterns: ['type.d.ts'],
};
