import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import BffPlugin from '@modern-js/plugin-bff';
import ExpressPlugin from '@modern-js/plugin-express';

export default defineConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
  },
  plugins: [AppToolsPlugin(), BffPlugin(), ExpressPlugin()],
});
