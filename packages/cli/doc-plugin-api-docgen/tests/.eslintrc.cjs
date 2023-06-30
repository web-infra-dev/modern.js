// eslint-disable-next-line import/no-commonjs
module.exports = {
  root: true,
  extends: '@modern-js-app',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: require.resolve('./tsconfig.json'),
  },
};
