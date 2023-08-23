import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  server: {
    ssr: {
      preload: true,
    },
  },
  runtime: {
    router: true,
  },

  plugins: [appTools()],
});
