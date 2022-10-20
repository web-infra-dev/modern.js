module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['vitest.config.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
