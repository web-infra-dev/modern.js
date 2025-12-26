import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  server: {
    ssr: {
      mode: 'string',
    },
  },
  plugins: [appTools()],
});
