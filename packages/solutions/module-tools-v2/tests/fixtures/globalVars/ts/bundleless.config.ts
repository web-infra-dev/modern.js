import { defineConfig } from '../../../utils';

export default defineConfig({
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      define: {
        VERSION: '1.0.1',
      },
      outdir: './dist/bundleless',
      buildType: 'bundleless',
      dts: false,
    };
  },
});
