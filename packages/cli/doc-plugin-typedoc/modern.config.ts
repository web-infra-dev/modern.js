// https://modernjs.dev/module-tools/en/api
// TODO: Add `defineConfig` after @modern-js/module-tools restore the function
export default {
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    sourceMap: true,
    externals: [
      '@modern-js/doc-core/src/shared/types/Plugin',
      '@modern-js/doc-core/src/shared/types/index',
    ],
    dts: {
      respectExternal: true,
    },
  },
};
