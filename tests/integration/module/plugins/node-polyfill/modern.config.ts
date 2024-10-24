import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [modulePluginNodePolyfill()],
  buildConfig: {
    input: {
      index: './src/index.js',
      another_entry: './src/another_entry.js',
    },
  },
});
