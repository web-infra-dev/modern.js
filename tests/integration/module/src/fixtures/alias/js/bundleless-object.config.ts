// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      alias: {
        '@src': './src',
      },
      ...preset.BASE_CONFIG,
      buildType: 'bundleless',
      outDir: './dist/bundleless/object',
    };
  },
});
