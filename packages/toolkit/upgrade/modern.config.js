module.exports = {
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        sourceMap: false,
        bundleOptions: {
          skipDeps: false,
        },
      },
      {
        enableDts: true,
        dtsOnly: true,
      },
    ],
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
