module.exports = {
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    autoExternal: false,
    externals: ['vm2'],
    alias: {
      chalk: '@modern-js/utils/chalk',
    },
    dts: false,
  },
};
