import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundle',
    outDir: './dist/exclude',
    asset: {
      svgr: {
        exclude: [/logo/],
      },
    },
    format: 'esm',
  },
});
