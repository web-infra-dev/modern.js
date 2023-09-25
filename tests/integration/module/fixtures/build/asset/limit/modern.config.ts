import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      limit: 0,
    },
    format: 'esm',
  },
});
