import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    assetPrefix: 'https://demo.com/',
  },
  plugins: [AppToolsPlugin()],
});
