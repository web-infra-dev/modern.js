import { defineConfig } from '../../utils';

export default defineConfig({
  source: {
    designSystem: {
      extend: {
        black: 'white',
      },
    },
  },
  buildPreset({ preset }) {
    return {
      ...preset.BASE_CONFIG,
      path: './dist/bundle',
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.css'],
      },
    };
  },
});
