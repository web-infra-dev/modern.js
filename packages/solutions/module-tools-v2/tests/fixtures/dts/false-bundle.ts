import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: false,
    outdir: './dist/false-bundle',
  },
});
