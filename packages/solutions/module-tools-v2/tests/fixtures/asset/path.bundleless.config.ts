import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    asset: {
      path: './asset',
    },
    outdir: './dist/bundleless',
  },
});
