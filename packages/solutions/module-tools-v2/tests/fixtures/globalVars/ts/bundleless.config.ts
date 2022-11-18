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
      path: './dist/bundleless',
      buildType: 'bundleless',
      dts: false,
    };
  },
});
