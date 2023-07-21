const { dtsConfig } = require('@scripts/build');

module.exports = {
  buildConfig: [
    {
      buildType: 'bundleless',
      format: 'cjs',
      // autoExternal: false,
      // externals: [
      //   /node_modules/,
      //   '@modern-js/plugin-lint',
      //   '@modern-js/plugin-changeset',
      // ],
      target: 'es2019',
      sourceMap: true,
      externalHelpers: true,
      // disableSwcTransform: true,
      dts: dtsConfig,
    },
  ],
};
