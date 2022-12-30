import { defineConfig } from '@modern-js/self/defineConfig';

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
      outDir: './dist/bundle/function',
      buildType: 'bundle',
    };
  },
});
