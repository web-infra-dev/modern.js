module.exports = {
  extends: ['@modern-js'],
  parserOptions: {
    project: [
      require.resolve('./tsconfig.json'),
      require.resolve('./tests/tsconfig.json'),
    ],
  },
  rules: {
    // https://eslint.org/docs/rules/complexity
    complexity: ['warn', { max: 40 }],
  },
  ignorePatterns: ['types.d.ts', 'compiled/'],
};
