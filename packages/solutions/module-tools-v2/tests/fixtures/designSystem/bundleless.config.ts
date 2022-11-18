import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  designSystem: {
    extend: {
      black: 'white',
    },
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      outdir: './dist/bundleless',
      buildType: 'bundleless',
    };
  },
});
