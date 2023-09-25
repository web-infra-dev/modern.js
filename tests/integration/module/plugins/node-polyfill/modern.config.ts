import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [modulePluginNodePolyfill()],
});
