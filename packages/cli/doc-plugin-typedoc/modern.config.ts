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
  },
};
