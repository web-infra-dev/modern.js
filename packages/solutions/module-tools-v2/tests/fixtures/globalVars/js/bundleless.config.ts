import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      outdir: './dist/bundleless',
      define: {
        VERSION: '1.0.1',
      },
      buildType: 'bundleless',
    };
  },
});
