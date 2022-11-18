import { defineConfig } from '../../../utils';

export default defineConfig({
  source: {
    envVars: ['VERSION'],
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      path: './dist/bundleless',
      buildType: 'bundleless',
      dts: false,
    };
  },
});
