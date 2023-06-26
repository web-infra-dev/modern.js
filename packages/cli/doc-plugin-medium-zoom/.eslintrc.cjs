module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['index.d.ts', 'MediumZoom.tsx'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
};
