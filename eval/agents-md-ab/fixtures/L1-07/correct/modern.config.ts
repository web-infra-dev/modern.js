import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  dev: {
    server: {
      proxy: {
        '/ext': 'https://example.com',
      },
    },
  },
});
