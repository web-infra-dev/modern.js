import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import { bundleServerPlugin } from '@modern-js/plugin-bundle-server';

export default defineConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: true,
  },
  plugins: [AppToolsPlugin()],
});
