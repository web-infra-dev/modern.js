import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      path: './asset',
      limit: 0,
    },
    outdir: './dist/bundle',
  },
});
