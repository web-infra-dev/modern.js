module.exports = {
  extends: ['@modern-js'],
  ignorePatterns: ['compiled/', 'fixtures/**', 'tests/**', 'modern.config.ts'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
