import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {},
  server: {
    ssr: true,
  },
  plugins: [PluginAppTools()],
});
