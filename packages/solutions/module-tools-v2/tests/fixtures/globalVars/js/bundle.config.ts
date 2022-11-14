import { defineConfig } from '../../../utils';

export default defineConfig({
  source: {
    globalVars: {
      VERSION: '1.0.1',
    },
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      path: './dist/bundle',
      buildType: 'bundle',
    };
  },
});
