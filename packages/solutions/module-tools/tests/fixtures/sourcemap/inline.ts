import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    sourceMap: 'inline',
    outdir: './dist/inline',
  },
});
