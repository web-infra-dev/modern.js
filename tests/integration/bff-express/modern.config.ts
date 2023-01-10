import appTools, { defineConfig } from '@modern-js/app-tools';
import bffPlugin from '@modern-js/plugin-bff';
import expressPlugin from '@modern-js/plugin-express';

export default defineConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
  },
  plugins: [appTools(), bffPlugin(), expressPlugin()],
});
