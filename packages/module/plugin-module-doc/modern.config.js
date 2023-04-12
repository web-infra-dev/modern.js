module.exports = {
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      target: 'es2020',
      sourceMap: true,
      input: {
        index: './src/index.ts',
      },
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      dts: false,
      input: {
        api: './src/components/api/index.tsx',
        codeContainer: './src/components/codeContainer/index.tsx',
        overview: './src/components/overview/index.tsx',
      },
      style: {
        inject: true,
      },
    },
  ],
};
