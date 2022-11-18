import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'umd',
    outdir: './dist/bundle',
  },
});
