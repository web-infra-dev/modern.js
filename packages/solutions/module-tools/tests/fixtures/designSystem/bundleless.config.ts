import { defineConfig } from '@modern-js/self/defineConfig';

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
