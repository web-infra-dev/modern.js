import { defineConfig } from '@modern-js/self';

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
      outdir: './dist/bundle/function',
      buildType: 'bundle',
    };
  },
});
