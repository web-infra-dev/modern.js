import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  tools: {
    devServer: {
      proxy: {
        '/ext': 'https://example.com',
      },
    },
  },
});
