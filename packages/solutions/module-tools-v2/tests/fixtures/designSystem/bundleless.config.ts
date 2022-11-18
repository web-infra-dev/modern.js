import { defineConfig } from '@modern-js/self';

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
