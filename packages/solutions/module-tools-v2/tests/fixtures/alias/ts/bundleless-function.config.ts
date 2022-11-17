import { defineConfig } from '../../../utils';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      alias: config => {
        return {
          ...config,
          '@src': './src',
        };
      },
      outdir: './dist/bundleless/function',
    };
  },
});
