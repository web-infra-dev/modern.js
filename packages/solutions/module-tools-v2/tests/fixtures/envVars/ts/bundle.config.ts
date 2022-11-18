import { defineConfig } from '../../../utils';

export default defineConfig({
  source: {
    envVars: ['VERSION'],
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      path: './dist/bundle',
      buildType: 'bundle',
      dts: false,
    };
  },
});
