import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginBff from '@modern-js/plugin-bff';
import PluginExpress from '@modern-js/plugin-express';

export default defineConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
  },
  plugins: [PluginAppTools(), PluginBff(), PluginExpress()],
});
