// import path from 'path';
import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      alias: {
        '@src': './src',
      },
      outDir: './dist/bundle/object',
      buildType: 'bundle',
    };
  },
});
