module.exports = {
  buildConfig: [
    {
      buildType: 'bundleless',
      format: 'cjs',
      target: 'es2019',
      dts: false,
      outDir: './dist/cjs',
      copy: {
        patterns: [
          {
            from: './compiled',
            context: __dirname,
            to: '../compiled',
          },
        ],
      },
    },
    {
      buildType: 'bundleless',
      format: 'esm',
      target: 'es2019',
      dts: false,
      outDir: './dist/esm',
    },
    {
      buildType: 'bundleless',
      dts: {
        only: true,
      },
      outDir: './dist/types',
    },
  ],
};
