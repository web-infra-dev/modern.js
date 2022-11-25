import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
  },
});
