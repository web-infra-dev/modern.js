module.exports = {
  root: true,
  extends: ['@modern-js'],
  parserOptions: {
    // the base path used to search for `tsconfig.json`
    tsconfigRootDir: __dirname,
    // the relative path to sub-package's `tsconfig.json`
    project: ['./tsconfig.json'],
  },
};
