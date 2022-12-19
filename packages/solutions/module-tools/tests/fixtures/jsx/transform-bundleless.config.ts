import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    jsx: 'transform',
    outdir: './dist/transform/bundleless',
  },
});
