import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    sourceMap: 'external',
    outDir: './dist/external',
  },
});
