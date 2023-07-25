import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'iife',
    outDir: './dist/bundle',
  },
});
