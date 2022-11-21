module.exports = {
  output: {
    buildConfig: [
      {
        format: 'cjs',
        bundleOptions: {
          skipDeps: false,
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
