import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    sourceMap: 'external',
    outdir: './dist/external',
  },
});
