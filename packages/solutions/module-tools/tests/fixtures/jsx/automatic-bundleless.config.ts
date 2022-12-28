import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    jsx: 'automatic',
    outDir: './dist/automatic/bundleless',
  },
});
