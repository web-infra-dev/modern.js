import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    outDir: './dist/bundleless',
    banner: {
      js: '/* js banner */',
      css: '/* css banner */',
      dts: '/* dts banner */',
    },
    footer: {
      js: '/* js footer */',
      css: '/* css footer */',
      dts: '/* dts footer */',
    },
  },
});
