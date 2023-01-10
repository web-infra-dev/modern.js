import appTools, { defineConfig } from '@modern-js/app-tools';
import bffPlugin from '@modern-js/plugin-bff';
import testingPlugin from '@modern-js/plugin-testing';
import koaPlugin from '@modern-js/plugin-koa';

export default defineConfig({
  bff: {
    prefix: '/api',
  },
  plugins: [appTools(), bffPlugin(), testingPlugin(), koaPlugin()],
});
