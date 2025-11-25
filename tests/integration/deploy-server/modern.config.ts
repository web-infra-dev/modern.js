import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import bff from '@modern-js/plugin-bff';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [AppToolsPlugin(), bff()],
  performance: {
    buildCache: false,
  },
});
