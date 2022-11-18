import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    jsx: 'transform',
    outdir: './dist/transform/bundleless',
  },
});
