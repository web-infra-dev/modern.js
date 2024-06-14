import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import bff from '@modern-js/plugin-bff';
import koa from '@modern-js/plugin-koa';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
  },
  source: {
    moduleScopes: [/plugin-data-loader/],
  },
  plugins: [AppToolsPlugin({}), bff(), koa()],
});
