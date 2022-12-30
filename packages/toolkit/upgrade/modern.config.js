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
      outDir: './dist',
      dts: {
        only: true,
      },
    },
  ],
};
