import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'esm',
    outdir: './dist/bundleless',
  },
});
