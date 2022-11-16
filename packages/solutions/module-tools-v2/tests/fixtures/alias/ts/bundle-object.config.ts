// import path from 'path';
import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      alias: {
        '@src': './src',
      },
      outdir: './dist/bundle/object',
      buildType: 'bundle',
    };
  },
});
