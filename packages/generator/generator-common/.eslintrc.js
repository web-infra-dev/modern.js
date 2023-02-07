module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['modern.config.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
