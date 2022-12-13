module.exports = {
  buildConfig: [
    {
      buildType: 'bundle',
      sourceMap: false,
      autoExternal: false,
      alias: {
        chalk: '@modern-js/utils/chalk',
      },
      dts: false,
    },
    {
      buildType: 'bundleless',
      outdir: './dist',
      dts: {
        only: true,
      },
    },
  ],
};
