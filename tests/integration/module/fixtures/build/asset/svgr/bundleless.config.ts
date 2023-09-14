import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundleless',
    outDir: './dist/bundleless',
    externals: [/^react\/?/],
    format: 'esm',
    asset: {
      svgr: true,
    },
  },
});
