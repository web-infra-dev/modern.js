import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      only: true,
    },
    outdir: './dist/only-bundle',
  },
});
