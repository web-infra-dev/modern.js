import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      path: './asset',
      limit: 0,
    },
    outDir: './dist/bundle',
  },
});
