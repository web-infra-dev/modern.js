module.exports = {
  output: {
    buildConfig: {
      buildType: 'bundle',
      sourceMap: false,
      bundleOptions: {
        skipDeps: false,
        externals: ['vm2'],
      },
    },
  },
};
