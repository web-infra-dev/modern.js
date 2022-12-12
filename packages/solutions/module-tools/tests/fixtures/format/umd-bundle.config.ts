import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'umd',
    outdir: './dist/bundle',
  },
});
