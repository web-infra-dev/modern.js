import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginKoa from '@modern-js/plugin-koa';
import PluginBff from '@modern-js/plugin-bff';
// import PluginTest from '@modern-js/plugin-testing/cli';

export default defineConfig({
  bff: {
    prefix: '/api',
  },
  plugins: [PluginAppTools(), PluginBff(), PluginKoa()],
});
