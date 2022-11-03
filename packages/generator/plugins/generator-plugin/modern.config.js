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
  tools: {
    speedy: {
      resolve: {
        alias: {
          chalk: '@modern-js/utils/chalk',
        },
      },
    },
  },
};
