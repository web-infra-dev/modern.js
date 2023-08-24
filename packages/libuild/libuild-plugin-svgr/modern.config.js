module.exports = {
  buildConfig: [
    {
      format: 'cjs',
      target: 'es2019',
      dts: false
    }, {
      buildType: 'bundleless',
      dts: {
        only: true
      }
    }
  ]
};

