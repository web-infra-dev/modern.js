import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { modulePluginPolyfill } from '@modern-js/plugin-module-polyfill';

export default defineConfig({
  buildConfig: {
    input: ['./src/index.ts'],
    buildType: 'bundleless',
  },

  plugins: [
    modulePluginPolyfill({
      targets: {
        ie: '10',
      },
    }),
  ],
});
