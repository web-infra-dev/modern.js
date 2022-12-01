module.exports = {
  output: {
    buildConfig: [
      {
        format: 'cjs',
        bundleOptions: {
          skipDeps: false,
          externals: [
            /node_modules/,
            '@modern-js/plugin-lint',
            '@modern-js/plugin-changeset',
          ],
        },
        target: 'es6',
        sourceMap: true,
      },
      {
        enableDts: true,
        dtsOnly: true,
      },
    ],
  },
};
