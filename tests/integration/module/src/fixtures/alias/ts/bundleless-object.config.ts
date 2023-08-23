import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: {
      '@src': './src',
    },
    buildType: 'bundleless',
    outDir: './dist/bundleless/object',
  },
});
