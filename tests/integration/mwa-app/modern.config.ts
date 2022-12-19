import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: {
    assetPrefix: true,
  },
  server: {
    port: 3333,
  },
});
