import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  server: {
    ssr: true,
  },
  plugins: [PluginAppTools()],
});
