module.exports = {
  output: {
    buildConfig: {
      buildType: 'bundle',
      bundleOptions: {
        skipDeps: false,
        externals: ['vm2'],
      },
    },
  },
};
