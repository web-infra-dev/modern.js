const { dtsConfig } = require('@scripts/build');

module.exports = {
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      target: 'es2020',
      sourceMap: true,
      dts: dtsConfig,
    },
  ],
};
