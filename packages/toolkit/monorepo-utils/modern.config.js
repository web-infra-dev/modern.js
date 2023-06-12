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
      externalHelpers: true,
    },
    {
      buildType: 'bundleless',
      format: 'esm',
      target: 'es2019',
      dts: false,
      outDir: './dist/esm',
      externalHelpers: true,
    },
    {
      buildType: 'bundleless',
      dts: {
        only: true,
      },
      outDir: './dist/types',
      externalHelpers: true,
    },
  ],
};
