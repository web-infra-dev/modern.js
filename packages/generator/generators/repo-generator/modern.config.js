module.exports = {
  buildConfig: {
    autoExternal: false,
    externals: ['vm2'],
    alias: {
      chalk: '@modern-js/utils/chalk',
    },
    dts: false,
  },
};
