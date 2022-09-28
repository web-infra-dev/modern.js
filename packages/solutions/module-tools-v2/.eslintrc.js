module.exports = {
  extends: ['@modern-js'],
  parserOptions: {
    project: [
      require.resolve('./tsconfig.json'),
      require.resolve('./tests/tsconfig.json'),
    ],
  },
  ignorePatterns: ['types.d.ts'],
};
