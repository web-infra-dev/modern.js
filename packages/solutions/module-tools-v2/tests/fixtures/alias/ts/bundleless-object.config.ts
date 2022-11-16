import { defineConfig } from '@modern-js/self';

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
