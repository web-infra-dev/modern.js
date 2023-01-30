import appTools, { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  output: {
    disableMinimize: true,
  },
  server: {
    ssr: true,
    worker: true,
  },
  plugins: [appTools()],
});
