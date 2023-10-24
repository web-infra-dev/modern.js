module.exports = {
  buildConfig: {
    target: 'es2019',
    autoExternal: false,
    alias: {
      chalk: '@modern-js/utils/chalk',
    },
    dts: false,
    externals: [
      '@modern-js/utils',
      '@modern-js/utils/lodash',
      '@modern-js/utils/fs-extra',
      '@modern-js/utils/chalk',
    ],
  },
};
