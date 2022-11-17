// import path from 'path';
import { defineConfig } from '../../../utils';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      alias: {
        '@src': './src',
      },
      outdir: './dist/bundleless/object',
    };
  },
});
