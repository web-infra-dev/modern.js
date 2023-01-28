import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  server: {
    worker: true,
  },
  plugins: [AppToolsPlugin()],
});
