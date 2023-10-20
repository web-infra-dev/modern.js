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
    complexity: ['warn', { max: 60 }],
    'consistent-return': [0],
    'node/prefer-global/buffer': [0],
  },
  ignorePatterns: ['types.d.ts', 'compiled/'],
};
