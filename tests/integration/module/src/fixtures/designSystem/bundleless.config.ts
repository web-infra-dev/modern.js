import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  designSystem: {
    extend: {
      black: 'white',
    },
  },
  buildConfig: {
    buildType: 'bundleless',
    outDir: './dist/bundleless',
  },
});
