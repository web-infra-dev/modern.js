// import path from 'path';
import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      alias: {
        '@src': './src',
      },
      ...preset.BASE_CONFIG,
      outdir: './dist/bundleless/object',
    };
  },
});
