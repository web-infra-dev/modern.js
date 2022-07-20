module.exports = {
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        bundleOptions: {
          skipDeps: false,
        },
      },
    ],
  },
  tools: {
    speedy: {
      external: ['vm2'],
    },
  },
};
