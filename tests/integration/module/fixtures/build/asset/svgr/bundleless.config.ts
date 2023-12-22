import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    input: ['src/index.js', 'src/logo.svg'],
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
