module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['index.d.ts'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  },
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['tsconfig.json'],
  },
};
