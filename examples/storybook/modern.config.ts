import path from 'node:path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';

export default defineConfig({
  source: {
    alias: {
      '@my-src': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [appTools(), bffPlugin()],
  output: {
    disableTsChecker: true,
  },
  bff: {
    prefix: '/bff-api',
  },
  server: {
    port: 8088,
  },
  dev: process.env.BFF_PROXY
    ? {
        server: {
          proxy: {
            '/bff-api': 'http://localhost:8088',
          },
        },
      }
    : {},
});
