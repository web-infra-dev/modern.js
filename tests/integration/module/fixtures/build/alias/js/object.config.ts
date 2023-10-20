// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: {
      '@src': './src',
    },
    outDir: './dist/object',
    buildType: 'bundle',
  },
});
