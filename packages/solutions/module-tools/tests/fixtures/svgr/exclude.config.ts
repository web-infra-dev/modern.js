import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundle',
    outdir: './dist/exclude',
    asset: {
      svgr: {
        exclude: [/logo/],
      },
    },
    format: 'esm',
  },
});
