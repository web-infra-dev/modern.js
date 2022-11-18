import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts', './src/browser.ts'],
    outdir: './dist/array',
  },
});
