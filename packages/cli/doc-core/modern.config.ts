// https://modernjs.dev/docs/apis/module/config
// TODO: Add `defineConfig` after @modern-js/module-tools restore the function
export default {
  testing: {
    transformer: 'ts-jest',
  },
  output: {
    buildConfig: {
      buildType: 'bundle',
      enableDts: true,
      format: 'esm',
    },
  },
};
