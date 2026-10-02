import { appTools, defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  plugins: [appTools()],
});
