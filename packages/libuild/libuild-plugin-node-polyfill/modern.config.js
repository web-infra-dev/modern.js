module.exports = {
  buildConfig: [
    {
      format: 'cjs',
      target: 'es2019',
      dts: false,
    },
    {
      buildType: 'bundleless',
      dts: {
        only: true,
      },
    },
    {
      target: 'esnext',
      format: 'esm',
      input: ['./src/mock/*'],
      outDir: 'dist/mock',
      dts: false,
    },
    {
      target: 'esnext',
      format: 'esm',
      input: ['./src/globals.js'],
      dts: false,
    },
  ],
};
