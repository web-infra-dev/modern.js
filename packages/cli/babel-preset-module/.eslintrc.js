module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['tests/fixtures/**/*'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tests/tsconfig.json'],
  },
};
