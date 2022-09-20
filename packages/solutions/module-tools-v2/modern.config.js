module.exports = {
  output: {
    buildConfig: [
      {
        // buildType: 'bundle',
        format: 'cjs',
        bundleOptions: {
          skipDeps: false,
          externals: [
            /node_modules/,
            '@modern-js/plugin-jarvis',
            '@modern-js/plugin-changeset',
          ],
        },
        target: 'es6',
      },
      {
        enableDts: true,
      },
    ],
  },
};
