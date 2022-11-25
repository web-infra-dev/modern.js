module.exports = {
  output: {
    buildConfig: {
      buildType: 'bundle',
      sourceMap: false,
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
