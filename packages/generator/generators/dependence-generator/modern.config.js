module.exports = {
  output: {
    buildConfig: {
      buildType: 'bundle',
      bundleOptions: {
        skipDeps: false,
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
