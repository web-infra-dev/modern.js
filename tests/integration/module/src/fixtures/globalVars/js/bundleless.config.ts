import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      outDir: './dist/bundleless',
      define: {
        VERSION: '1.0.1',
      },
      buildType: 'bundleless',
    };
  },
});
