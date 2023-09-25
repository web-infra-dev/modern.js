import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    outDir: './dist/bundleless',
    define: {
      VERSION: '1.0.1',
    },
    buildType: 'bundleless',
  },
});
