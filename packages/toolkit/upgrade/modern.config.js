const { skipDts } = require('@scripts/build');

module.exports = {
  buildConfig: [
    {
      buildType: 'bundle',
      sourceMap: false,
      autoExternal: true,
      dts: false,
    },
    skipDts
      ? null
      : {
          buildType: 'bundleless',
          outDir: './dist',
          dts: {
            only: true,
          },
        },
  ].filter(Boolean),
};
