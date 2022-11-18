import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: false,
    outdir: './dist/false-bundle',
  },
});
