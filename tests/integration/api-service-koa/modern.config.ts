import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import BffPlugin from '@modern-js/plugin-bff';
import TestingPlugin from '@modern-js/plugin-testing';
import KoaPlugin from '@modern-js/plugin-koa';

export default defineConfig({
  bff: {
    prefix: '/api',
  },
  plugins: [AppToolsPlugin(), BffPlugin(), TestingPlugin(), KoaPlugin()],
});
