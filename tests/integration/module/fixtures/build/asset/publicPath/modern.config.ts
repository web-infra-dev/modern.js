import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      publicPath: '/public/',
      limit: 0,
    },
    format: 'esm',
  },
});
