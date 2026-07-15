import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  dev: {
    proxy: {
      '/ext': 'https://example.com',
    },
  },
});
