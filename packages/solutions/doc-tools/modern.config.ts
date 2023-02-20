// https://modernjs.dev/docs/apis/module/config
// TODO: Add `defineConfig` after @modern-js/module-tools restore the function
export default {
  buildConfig: [
    {
      buildType: 'bundle',
      dts: false,
    },
    { buildType: 'bundleless', dts: { only: true } },
  ],
};
