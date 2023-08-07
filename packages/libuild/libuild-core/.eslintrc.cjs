module.exports = {
  root: true,
  extends: ['@modern-js/eslint-config'],
  ignorePatterns: ['scripts/*.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
