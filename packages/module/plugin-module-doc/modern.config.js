module.exports = {
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      target: 'es2020',
      sourceMap: true,
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      dts: false,
      input: {
        api: './src/components/api/index.tsx',
        overview: './src/components/overview/index.tsx',
      },
      style: {
        inject: true,
      },
    },
  ],
};
