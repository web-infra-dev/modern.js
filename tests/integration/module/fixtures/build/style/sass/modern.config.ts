import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    style: {},
    asset: {
      limit: 0,
    },
    input: ['index.sass'],
  },
});
