import { defineConfig } from '../../../utils';

export default defineConfig({
  source: {
    alias: config => {
      return {
        ...config,
        '@src': './src',
      };
    },
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      path: './dist/bundle/function',
      buildType: 'bundle',
    };
  },
});
