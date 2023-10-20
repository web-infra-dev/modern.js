import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    outDir: './dist/bundle',
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
