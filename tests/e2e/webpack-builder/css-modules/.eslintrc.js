module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['src/**/*'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
