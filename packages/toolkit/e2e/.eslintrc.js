module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['vitest.config.ts', 'fixtures/'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
