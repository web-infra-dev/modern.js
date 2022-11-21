import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      only: true,
    },
    outdir: './dist/only-bundle',
  },
});
