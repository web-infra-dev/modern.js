import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts', './src/browser.ts'],
    outdir: './dist/array',
  },
});
