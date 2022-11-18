import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    sourceMap: 'external',
    outdir: './dist/external',
  },
});
