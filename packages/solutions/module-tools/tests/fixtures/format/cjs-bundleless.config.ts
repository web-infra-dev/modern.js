import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    outdir: './dist/bundleless',
  },
});
