import { skipDts } from '@scripts/build';

// https://modernjs.dev/module-tools/en/api
// TODO: Add `defineConfig` after @modern-js/module-tools restore the function
export default {
  buildConfig: [
    {
      buildType: 'bundle',
      dts: false,
    },
    skipDts ? null : { buildType: 'bundleless', dts: { only: true } },
  ].filter(Boolean),
};
