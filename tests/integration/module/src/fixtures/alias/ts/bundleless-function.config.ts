import { defineConfig } from '@modern-js/module-tools/defineConfig';

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
      buildType: 'bundleless',
      outDir: './dist/bundleless/function',
    };
  },
});
