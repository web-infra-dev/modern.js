const { dtsConfig } = require('@scripts/build');

module.exports = {
  buildConfig: [
    {
      buildType: 'bundleless',
      format: 'cjs',
      target: 'es2019',
      externalHelpers: true,
      dts: dtsConfig,
    },
  ],
};
