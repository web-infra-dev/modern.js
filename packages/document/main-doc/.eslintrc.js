module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: ['rspress.config.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    'babel/no-unused-expressions': 0,
    'react/jsx-filename-extension': 0,
  },
};
