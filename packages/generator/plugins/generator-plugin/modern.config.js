module.exports = {
  buildConfig: {
    target: 'es2019',
    autoExternal: false,
    alias: {
      chalk: '@modern-js/utils/chalk',
    },
    dts: false,
    externals: [
      'bluebird',
      '@sigstore/core',
      '@sigstore/verify',
      'node-gyp/bin/node-gyp.js',
    ],
  },
};
