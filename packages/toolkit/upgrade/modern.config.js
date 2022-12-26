module.exports = {
  buildConfig: [
    {
      buildType: 'bundle',
      sourceMap: false,
      autoExternal: true,
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
