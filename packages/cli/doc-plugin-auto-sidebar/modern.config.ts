// https://modernjs.dev/docs/apis/module/config
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
