// https://modernjs.dev/module-tools/en/api
// TODO: Add `defineConfig` after @modern-js/module-tools restore the function
export default {
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'esm',
      sourceMap: true,
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      dts: false,
      input: {
        codeContainer: './src/components/codeContainer.tsx',
        preview: './src/components/preview.tsx',
        demo: './src/components/demo.tsx',
      },
      externals: ['virtual-meta', '@modern-js/doc-core/runtime'],
      style: {
        inject: true,
      },
    },
  ],
};
