import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'automatic',
    outDir: './dist/automatic/bundle',
  },
});
