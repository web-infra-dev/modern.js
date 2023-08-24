module.exports = {
  root: true,
  extends: ['@modern-js/eslint-config'],
  ignorePatterns: ['scripts/*.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    // https://eslint.org/docs/rules/complexity
    complexity: ['warn', { max: 50 }],
    treatUndefinedAsUnspecified: true,
};
