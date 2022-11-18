import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    asset: {
      path: './asset',
    },
    outdir: './dist/bundleless',
  },
});
