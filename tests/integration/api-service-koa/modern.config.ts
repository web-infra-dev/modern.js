import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginBff from '@modern-js/plugin-bff';
import PluginTest from '@modern-js/plugin-testing';
import PluginKoa from '@modern-js/plugin-koa';

export default defineConfig({
  bff: {
    prefix: '/api',
  },
  plugins: [PluginAppTools(), PluginBff(), PluginTest(), PluginKoa()],
});
