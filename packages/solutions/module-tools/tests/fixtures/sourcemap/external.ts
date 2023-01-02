import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    sourceMap: 'external',
    outDir: './dist/external',
  },
});
