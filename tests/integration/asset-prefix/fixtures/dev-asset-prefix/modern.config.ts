import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: {
    assetPrefix: true,
  },
  output: {
    polyfill: 'off',
  },
  server: {
    port: 3333,
  },
  plugins: [AppToolsPlugin()],
});
