// https://modernjs.dev/module-tools/en/api

export default {
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      target: 'es2020',
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      dts: false,
      input: ['./src/virtual-demo.tsx'],
      externals: [
        'virtual-meta',
        '@modern-js/doc-core/runtime',
        'react',
        'react-dom',
        'react-router-dom',
      ],
      style: {
        inject: true,
      },
    },
  ],
};
