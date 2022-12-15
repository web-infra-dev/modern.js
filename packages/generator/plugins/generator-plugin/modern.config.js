module.exports = {
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    autoExternal: false,
    alias: {
      chalk: '@modern-js/utils/chalk',
    },
    dts: false,
  },
};
