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
      outdir: './dist/bundle',
      buildType: 'bundle',
      input: ['./src/index.css'],
    };
  },
});
