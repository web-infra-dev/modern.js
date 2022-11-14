// import path from 'path';
import { defineConfig } from '../../../utils';

export default defineConfig({
  source: {
    alias: {
      '@src': './src',
    },
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      path: './dist/bundle/object',
      buildType: 'bundle',
    };
  },
});
