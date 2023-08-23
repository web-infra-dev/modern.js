import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    define: {
      VERSION: '1.0.1',
    },
    outDir: './dist/bundle',
    buildType: 'bundle',
  },
});
