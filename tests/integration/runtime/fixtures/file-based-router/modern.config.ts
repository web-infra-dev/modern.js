import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginRouterLegacy from '@modern-js/plugin-router-legacy';

export default defineConfig({
  runtime: {
    router: {
      legacy: true,
    },
  },
  plugins: [PluginAppTools(), PluginRouterLegacy()],
});
