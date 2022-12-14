import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: {
      legacy: true,
    },
  },
  plugins: [PluginAppTools()],
});
